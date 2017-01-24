// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('../base');
var Candidate = require('../candidate');
var reminderInstanceMethods = require('./reminder').instanceMethods;
var statusInstanceMethods = require('./status').instanceMethods;

// Re-expose status info onto exports
exports.STATUSES = require('./status').STATUSES;
exports.ADD_HUMAN_STATUSES = require('./status').ADD_HUMAN_STATUSES;
exports.EDIT_HUMAN_STATUSES = require('./status').EDIT_HUMAN_STATUSES;

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
var Application = module.exports = _.extend(baseDefine('application', {
  id: {
    type: baseDefine.ID, defaultValue: Sequelize.UUIDV4, primaryKey: true,
    validate: {isUUID: 4}
  },
  candidate_id: {
    type: baseDefine.ID, allowNull: false,
    references: {model: Candidate, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'CASCADE'
  },

  // Example: 2016-01-08, no time but we reuse type for development simplicity
  application_date_moment: {type: baseDefine.MOMENT_NO_TZ, defaultValue: null, allowNull: true},
  // DEV: We don't use timezone for archived at as this is set by our system so user has no timezone setting
  archived_at_moment: {type: baseDefine.MOMENT_NO_TZ, defaultValue: null, allowNull: true},

  // Example: Sky Networks
  // DEV: This is never null, only an empty string (this gives us falsy consistency)
  company_name: {type: Sequelize.STRING(255), defaultValue: '', allowNull: false},

  // DEV: We allow url OR name in controller but url always backfills name
  name: {
    type: Sequelize.STRING(255), allowNull: false,
    validate: {notEmpty: {args: true, msg: 'Name cannot be empty'}}
  },

  // Example: Website <a href="https://sky.net/">https://sky.net/</a>
  notes: {type: Sequelize.STRING(64 * 1024) /* 64kb */, defaultValue: '', allowNull: false},

  // DEV: GET URL limit is 2083 but 1024 is simpler
  // http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
  // DEV: This is never null, only an empty string (this gives us falsy consistency)
  posting_url: {type: Sequelize.STRING(1024), defaultValue: '', allowNull: false},

  // TODO: Probably add an index based on application status
  status: {
    type: Sequelize.STRING(36), allowNull: false,
    validate: {isIn: {args: [_.values(exports.STATUSES)], msg: 'Invalid status provided'}}
  },

  // Define our reminders
  saved_for_later_reminder_id: {
    type: baseDefine.ID, allowNull: true,
    references: {model: 'application_reminders', key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'RESTRICT'
  },
  waiting_for_response_reminder_id: {
    type: baseDefine.ID, allowNull: true,
    references: {model: 'application_reminders', key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'RESTRICT'
  },
  received_offer_reminder_id: {
    type: baseDefine.ID, allowNull: true,
    references: {model: 'application_reminders', key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'RESTRICT'
  }
}, {
  validate: {
    statusHasMatchingReminder: function () {
      // If we have a status that expects a reminder, then verify it exists
      var status = this.getDataValue('status');
      if (status === exports.STATUSES.SAVED_FOR_LATER) {
        assert(this.getDataValue('saved_for_later_reminder_id'),
          'Expected "saved_for_later" application to have a saved for later reminder set');
      } else if (status === exports.STATUSES.WAITING_FOR_RESPONSE) {
        assert(this.getDataValue('waiting_for_response_reminder_id'),
          'Expected "waiting_for_response" application to have a waiting for response reminder set');
      } else if (status === exports.STATUSES.UPCOMING_INTERVIEW) {
        // No assertions necessary (handled by interview)
      } else if (status === exports.STATUSES.RECEIVED_OFFER) {
        assert(this.getDataValue('received_offer_reminder_id'),
          'Expected "received_offer" application to have a received offer reminder set');
      } else if (status === exports.STATUSES.ARCHIVED) {
        // No assertions necessary
      } else {
        throw new Error('Unexpected status received');
      }
    },
    statusHasMatchingApplicationDate: function () {
      // If our status isn't saved for later, verify we have an application date
      var status = this.getDataValue('status');
      if (status === exports.STATUSES.SAVED_FOR_LATER) {
        assert(!this.getDataValue('application_date_datetime'),
          'Expected "saved_for_later" application to not have an application date set');
      } else {
        assert(this.getDataValue('application_date_datetime'),
          'Expected non-"saved_for_later" application to have an application date set');
      }
    },
    statusHasMatchingArchivedDate: function () {
      // If our status is archived, verify we have an archived date
      var status = this.getDataValue('status');
      if (status === exports.STATUSES.ARCHIVED) {
        assert(this.getDataValue('archived_at_datetime'),
          'Expected "archived" application to have an archived at date set');
      } else {
        assert(!this.getDataValue('archived_at_datetime'),
          'Expected non-"archived" application to not have an archived at date');
      }
    }
  },

  instanceMethods: _.extend({
    // Instance methods go here
  }, reminderInstanceMethods, statusInstanceMethods),

  setterMethods: {
    status: function (val) {
      // If the record is being updated, then prevent status from being set directly
      // DEV: It's easy to get into an edge case status wise so we have methods for this
      //   Edge case example: When restoring an archived application, what's its status?
      if (!this.isNewRecord) {
        throw new Error('`Application.status` cannot be set directly. ' +
          'Please use a `application.updateTo*()` instead (e.g. `application.updateToApplied();`)');
      }

      // Set our value normally
      this.setDataValue('status', val);
    }
  },
  getterMethods: {
    add_interview_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/add-interview
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/add-interview';
    },
    applied_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/applied
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/applied';
    },
    archive_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/archive
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/archive';
    },
    closest_upcoming_interview: function () {
      var upcomingInterviews = this.get('upcoming_interviews');
      if (upcomingInterviews && upcomingInterviews.length) {
        // Example: Assuming today is 2017-01-01 and interviews are 2017-02-01 and 2017-03-01
        //   we want `2017-02-01` as it's closest so we use `isBefore`
        return upcomingInterviews.reduce(function findClosestInterview (a, b) {
          return a.get('date_time_moment').isBefore(b.get('date_time_moment')) ? a : b;
        }, upcomingInterviews[0]);
      }
      return null;
    },
    delete_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/delete
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/delete';
    },
    human_status: function () {
      return exports.EDIT_HUMAN_STATUSES[this.get('status_key')];
    },
    last_contact_moment: function () {
      // Verify we have both past interviews and application date resolved
      var pastInterviews = this.get('past_interviews');
      var applicationDateMomemt = this.get('application_date_moment');
      if (!pastInterviews || !applicationDateMomemt) {
        return null;
      }

      // Resolve our past interview moments
      var pastInterviewMoments = pastInterviews.map(function getDateTimeMoment (pastInterview) {
        return pastInterview.get('date_time_moment');
      });

      // Find the most recent moment
      return pastInterviewMoments.reduce(function findLatestInterview (momentA, momentB) {
        return momentA.isAfter(momentB) ? momentA : momentB;
      }, applicationDateMomemt);
    },
    past_interviews: function () {
      // TODO: Consider fetching past interviews as a query
      var interviews = this.get('interviews');
      if (interviews) {
        var Interview = this.sequelize.models.interview;
        return interviews.filter(function isPastInterview (interview) {
          return interview.get('type') === Interview.TYPES.PAST_INTERVIEW;
        });
      }
      return null;
    },
    received_offer_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/received-offer
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/received-offer';
    },
    remove_offer_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/remove-offer
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/remove-offer';
    },
    restore_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/restore
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/restore';
    },
    status_key: function () {
      return this.getDataValue('status').toUpperCase();
    },
    upcoming_interviews: function () {
      // TODO: Consider fetching upcoming interviews as a query
      var interviews = this.get('interviews');
      if (interviews) {
        var Interview = this.sequelize.models.interview;
        return interviews.filter(function isUpcomingInterview (interview) {
          return interview.get('type') === Interview.TYPES.UPCOMING_INTERVIEW;
        });
      }
      return null;
    },
    url: function () {
      // Example: /application/abcdef-sky-networks-uuid
      return '/application/' + encodeURIComponent(this.getDataValue('id'));
    }
  }
}), exports);
// DEV: To prevent circular dependencies, we define parent/child relationships in model where foreign key is
Application.belongsTo(Candidate);
Candidate.hasMany(Application);

// Expose Reminder keys for ApplicationReminder to bind on
Application._reminderKeys = [
  'saved_for_later_reminder',
  'waiting_for_response_reminder',
  'received_offer_reminder'
];
