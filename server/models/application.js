// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base.js');

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
// TODO: Add in db properties like `created_at`/`updated_at` (prob handled via timestamps in `baseDefine`)
// TODO: Add in support for `audit_log`
module.exports = _.extend(baseDefine('application', {
  // TODO: Switch over to Sequelize.UUIDV4
  // TODO: Verify we make this a UNIQUE PRIMARY INDEX in SQL migrations
  id: {type: Sequelize.STRING(36), primaryKey: true},

  // Example: 2016-01-08, no time
  application_date_moment: {type: baseDefine.MOMENT_DATEONLY, defaultValue: null, allowNull: true},
  archived_at_moment: {type: baseDefine.MOMENT_TZ, defaultValue: null, allowNull: true},

  // Example: Sky Networks
  // DEV: This is never null, only an empty string (this gives us falsy consistency)
  company_name: {type: Sequelize.STRING(255), defaultValue: '', allowNull: false},

  // TODO: Reminders should be in their own table =/
  follow_up_reminder_moment: {type: baseDefine.MOMENT_TZ, defaultValue: null, allowNull: true},

  // DEV: We allow url OR name in controller but url always backfills name
  name: {type: Sequelize.STRING(255), allowNull: false},

  // Example: Website <a href="https://sky.net/">https://sky.net/</a>
  notes: {type: Sequelize.STRING(64 * 1024) /* 64kb */, defaultValue: '', allowNull: false},

  // DEV: GET URL limit is 2083 but 1024 is simpler
  // http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
  // DEV: This is never null, only an empty string (this gives us falsy consistency)
  posting_url: {type: Sequelize.STRING(1024), defaultValue: '', allowNull: false},

  // TODO: Add validation for status
  // TODO: Probably add an index based on application status
  status: {type: Sequelize.STRING(36), allowNull: false}
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
    delete_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/delete
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/delete';
    },
    human_status: function () {
      return exports.APPLICATION_EDIT_HUMAN_STATUSES[this.get('status_key')];
    },
    received_offer_url: function () {
      // Example: /application/abcdef-sky-networks-uuid/received-offer
      return '/application/' + encodeURIComponent(this.getDataValue('id')) + '/received-offer';
    },
    status_key: function () {
      return this.getDataValue('status').toUpperCase();
    },
    url: function () {
      // Example: /application/abcdef-sky-networks-uuid
      return '/application/' + encodeURIComponent(this.getDataValue('id'));
    }
  }
}), exports);
