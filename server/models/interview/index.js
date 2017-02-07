// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var baseDefine = require('../base.js');
var Sequelize = require('sequelize');
var Application = require('../application');
var Candidate = require('../candidate');
var getExternalUrl = require('../../utils/url').getExternalUrl;
var reminderInstanceMethods = require('./reminder').instanceMethods;

// Define our constants
exports.TYPES = {
  PAST_INTERVIEW: 'past_interview',
  UPCOMING_INTERVIEW: 'upcoming_interview'
};

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
var Interview = module.exports = _.extend(baseDefine('interview', {
  id: {
    type: baseDefine.ID, defaultValue: Sequelize.UUIDV4, primaryKey: true,
    validate: {isUUID: 4}
  },
  candidate_id: {
    type: baseDefine.ID, allowNull: false,
    references: {model: Candidate, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'CASCADE'
  },

  application_id: {
    type: baseDefine.ID, allowNull: false,
    // DEV: Additionally, we make our foreign key double bound to Application's application_id/candidate_id via SQL
    //   This is to prevent candidate_id ever getting out of sync via attacks/race conditions
    references: {model: Application, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'CASCADE'
  },

  date_time_moment: {type: baseDefine.MOMENT_TZ, allowNull: false},

  // DEV: We store `type` on interview instead of using date_time_moment as queues can run slow and
  //   we want to show interviews as upcoming until they're processed. Otherwise, application/interview logic breaks
  type: {
    type: Sequelize.STRING(36), allowNull: false,
    validate: {isIn: {args: [_.values(exports.TYPES)], msg: 'Invalid type provided'}}
  },
  // DEV: We store `can_send_reminders` on interview instead of looking at reminders
  //   so we can allow easy reminder restoration for past/upcoming toggles
  //   and preserve reminder intent when moving from upcoming to past interviews
  can_send_reminders: {type: Sequelize.BOOLEAN, allowNull: false},

  // Allow long notes for interview (prevent null, only empty strings)
  // DEV: Alternative names for `details` are `instructions`, `info`, and `information`
  // TODO: Be sure to sanitize details (done in view)
  // TODO: Fix up not rendering HTML in interview add/edit view
  details: {type: Sequelize.STRING(1024), allowNull: false},

  // Define our reminders
  pre_interview_reminder_id: {
    type: baseDefine.ID, allowNull: false,
    references: {model: 'interview_reminders', key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'RESTRICT'
  },
  post_interview_reminder_id: {
    type: baseDefine.ID, allowNull: false,
    references: {model: 'interview_reminders', key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'RESTRICT'
  }
}, {
  validate: {
    typeMatchesDateTime: function () {
      // DEV: This can fail if we get behind in processing a queue and a user submits an edit
      //   However, we should be handling type updates upon edit as is
      if (new Date() < this.get('date_time_datetime')) {
        assert.strictEqual(this.get('type'), exports.TYPES.UPCOMING_INTERVIEW,
          'Expected type for upcoming interview to be "upcoming interview" but it wasn\'t');
      } else {
        assert.strictEqual(this.get('type'), exports.TYPES.PAST_INTERVIEW,
          'Expected type for past interview to be "past interview" but it wasn\'t');
      }
    },
    typeMatchesCanSendReminders: function () {
      // If we are a past interview, allow both reminders being sent (upcoming -> past)/not sent (past -> past)
      if (this.get('type') === exports.TYPES.PAST_INTERVIEW) {
        // Do nothing
      // Otherwise, if we are an upcoming interview, require reminders to be sent
      } else {
        assert.strictEqual(this.get('can_send_reminders'), true,
          'Expected can_send_reminders for upcoming interview to be true but it wasn\'t');
      }
    },
    // DEV: We skip `applicationStatusMatchesType` during fixture construction due to lack of relationships
    applicationStatusMatchesType: function () {
      var application = this.get('application');
      assert(application, 'Interview must have an `application` property to validate/save');
      return application.$modelOptions.validate.statusMatchesInterviews.call(application);
    }
  },

  instanceMethods: _.extend({
    // DEV: Type and `can_send_reminders` are related but exclusive so we have different methods
    updateType: function () {
      // If we don't have a datetime to compare to, then ignore update
      // DEV: This can occur on initial `build`
      var dateTimeDatetime = this.get('date_time_datetime');
      if (!dateTimeDatetime) {
        return;
      }

      // Otherwise, update our type to match
      if (new Date() < dateTimeDatetime) {
        this.setDataValue('type', exports.TYPES.UPCOMING_INTERVIEW);
      } else {
        this.setDataValue('type', exports.TYPES.PAST_INTERVIEW);
      }
    },
    updateCanSendReminders: function () {
      var dateTimeDatetime = this.get('date_time_datetime');
      if (!dateTimeDatetime) {
        return;
      }
      if (new Date() < dateTimeDatetime) {
        this.setDataValue('can_send_reminders', true);
      } else {
        this.setDataValue('can_send_reminders', false);
      }
    }
  }, reminderInstanceMethods),

  getterMethods: {
    delete_url: function () {
      // Example: /interview/abcdef-sky-networks-interview-uuid/delete
      return '/interview/' + encodeURIComponent(this.getDataValue('id')) + '/delete';
    },
    external_url: function () {
      return getExternalUrl(this.get('url'));
    },
    url: function () {
      // Example: /interview/abcdef-sky-networks-interview-uuid
      return '/interview/' + encodeURIComponent(this.getDataValue('id'));
    }
  },

  setterMethods: {
    can_send_reminders: function (val) {
      throw new Error('`can_send_reminders` cannot be set directly. Please update date/time ' +
        'or use `updateCanSendReminders()`');
    },
    date_time_datetime: function (val) {
      // DEV: We don't proxy `date_time_timezone` as it's presentation only
      var retVal = this.setDataValue('date_time_datetime', val);
      this.updateType();
      this.updateCanSendReminders();
      return retVal;
    },
    type: function (val) {
      throw new Error('`type` cannot be set directly. Please update date/time or use `updateType()`');
    }
  }
}), exports);
// DEV: To prevent circular dependencies, we define parent/child relationships in model where foreign key is
Interview.belongsTo(Application);
Application.hasMany(Interview);
Interview.belongsTo(Candidate);
Candidate.hasMany(Interview);

// Expose Reminder keys for InterviewReminder to bind on
Interview._reminderKeys = [
  'pre_interview_reminder',
  'post_interview_reminder'
];
