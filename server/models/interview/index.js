// Load in our dependencies
var _ = require('underscore');
var baseDefine = require('../base.js');
var Sequelize = require('sequelize');
var Application = require('../application');
var Candidate = require('../candidate');
var reminderInstanceMethods = require('./reminder').instanceMethods;

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
var Interview = module.exports = baseDefine('interview', {
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
  instanceMethods: _.extend({
    // Instance methods go here
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
  }
});
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
