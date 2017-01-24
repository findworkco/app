// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var baseDefine = require('../base.js');
var Sequelize = require('sequelize');
var Application = require('../application');
var Candidate = require('../candidate');
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
    }
  },

  instanceMethods: _.extend({
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
    }
  }, reminderInstanceMethods),

  getterMethods: {
    delete_url: function () {
      // Example: /interview/abcdef-sky-networks-interview-uuid/delete
      return '/interview/' + encodeURIComponent(this.getDataValue('id')) + '/delete';
    },
    url: function () {
      // Example: /interview/abcdef-sky-networks-interview-uuid
      return '/interview/' + encodeURIComponent(this.getDataValue('id'));
    }
  },

  setterMethods: {
    date_time_datetime: function (val) {
      // DEV: We don't proxy `date_time_timezone` as it's presentation only
      var retVal = this.setDataValue('date_time_datetime', val);
      this.updateType();
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
