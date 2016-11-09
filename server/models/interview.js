// Load in our dependencies
var baseDefine = require('./base.js');
var Sequelize = require('sequelize');
var Application = require('./application');

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
// TODO: Add in db properties like `created_at`/`updated_at` (prob handled via timestamps in `baseDefine`)
// TODO: Add in support for `audit_log`
module.exports = baseDefine('interview', {
  // TODO: Switch over to Sequelize.UUIDV4
  // TODO: Verify we make this a UNIQUE PRIMARY INDEX in SQL migrations
  id: {type: Sequelize.STRING(36), primaryKey: true},

  // TODO: Verify foreign key properly set up
  application_id: {
    type: Sequelize.STRING(36),
    allowNull: false,
    references: {
      model: Application,
      key: 'id'
    }
  },

  date_time_moment: {type: baseDefine.MOMENT_TZ, allowNull: false},

  // Allow long notes for interview (prevent null, only empty strings)
  // DEV: Alternative names for `details` are `instructions`, `info`, and `information`
  // TODO: Be sure to sanitize details (done in view)
  // TODO: Fix up not rendering HTML in interview add/edit view
  details: {type: Sequelize.STRING(1024), allowNull: false},

  // TODO: Pre/post interview reminders should be in reminder table
  pre_interview_reminder_moment: {type: baseDefine.MOMENT_TZ, defaultValue: null, allowNull: true},
  post_interview_reminder_moment: {type: baseDefine.MOMENT_TZ, defaultValue: null, allowNull: true}
}, {
  getterMethods: {
    delete_url: function () {
      // Example: /interview/abcdef-sky-networks-interview-uuid/delete
      return '/interview/' + encodeURIComponent(this.getDataValue('id')) + '/delete';
    },
    url: function () {
      // Example: /interview/abcdef-sky-networks-interview-uuid
      return '/interview/' + encodeURIComponent(this.getDataValue('id'));
    }
  }
});
