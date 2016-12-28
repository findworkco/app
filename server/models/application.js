// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base.js');
var Reminder = require('./reminder');

// Define constants for our applications
exports.APPLICATION_STATUSES = {
  SAVED_FOR_LATER: 'saved_for_later',
  WAITING_FOR_RESPONSE: 'waiting_for_response',
  UPCOMING_INTERVIEW: 'upcoming_interview',
  RECEIVED_OFFER: 'received_offer',
  ARCHIVED: 'archived'
};
exports.APPLICATION_ADD_HUMAN_STATUSES = {
  SAVED_FOR_LATER: 'Saving for later',
  WAITING_FOR_RESPONSE: 'Waiting for response',
  UPCOMING_INTERVIEW: 'Upcoming interview',
  RECEIVED_OFFER: 'Received offer'
};
exports.APPLICATION_EDIT_HUMAN_STATUSES = _.defaults({
  SAVED_FOR_LATER: 'Saved for later',
  ARCHIVED: 'Archived'
}, exports.APPLICATION_ADD_HUMAN_STATUSES);

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
var Application = module.exports = _.extend(baseDefine('application', {
  id: {
    type: baseDefine.ID, defaultValue: Sequelize.UUIDV4, primaryKey: true,
    validate: {isUUID: 4}
  },

  // Example: 2016-01-08, no time
  application_date_moment: {type: baseDefine.MOMENT_DATEONLY, defaultValue: null, allowNull: true},
  // DEV: We don't use timezone for archived at as this is set by our system so user has no timezone setting
  archived_at_moment: {type: baseDefine.MOMENT_DATEONLY, defaultValue: null, allowNull: true},

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
    validate: {isIn: {args: [_.values(exports.APPLICATION_STATUSES)], msg: 'Invalid status provided'}}
  },

  // Define our reminders
  saved_for_later_reminder_id: {
    type: baseDefine.ID, allowNull: true,
    references: {model: Reminder, key: 'id'}
  },
  waiting_for_response_reminder_id: {
    type: baseDefine.ID, allowNull: true,
    references: {model: Reminder, key: 'id'}
  },
  received_offer_reminder_id: {
    type: baseDefine.ID, allowNull: true,
    references: {model: Reminder, key: 'id'}
  }
}, {
  getterMethods: {
    add_interview_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/add-interview
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/add-interview';
    },
    archive_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/archive
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/archive';
    },
    closest_upcoming_interview: function () {
      var upcomingInterviews = this.get('upcoming_interviews');
      if (upcomingInterviews && upcomingInterviews.length) {
        // TODO: Sort upcoming interviews and fetch latest one
        //   Also consider making this into a query
        return upcomingInterviews[0];
      }
      return null;
    },
    delete_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/delete
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/delete';
    },
    human_status: function () {
      return exports.APPLICATION_EDIT_HUMAN_STATUSES[this.get('status_key')];
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
        var now = new Date();
        return interviews.filter(function isPastInterview (interview) {
          return interview.date_time_datetime < now;
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
      // TODO: Consider fetching past interviews as a query
      var interviews = this.get('interviews');
      if (interviews) {
        var now = new Date();
        return interviews.filter(function isUpcomingInterview (interview) {
          return interview.date_time_datetime >= now;
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

// DEV: Reminder has no strict parent so we can only define parent to child
Application.hasOne(Reminder, {
  as: 'saved_for_later_reminder',
  foreignKey: 'saved_for_later_reminder_id'
});
Application.hasOne(Reminder, {
  as: 'waiting_for_response_reminder',
  foreignKey: 'waiting_for_response_reminder_id'
});
Application.hasOne(Reminder, {
  as: 'received_offer_reminder',
  foreignKey: 'received_offer_reminder_id'
});
