// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base');
var Interview = require('./interview');
var Reminder = require('./reminder');

// Define our constants
exports.TYPES = {
  PRE_INTERVIEW: 'pre_interview',
  POST_INTERVIEW: 'post_interview'
};

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
var InterviewReminder = module.exports = _.extend(baseDefine('interview_reminder', _.defaults({
  interview_id: {
    type: baseDefine.ID, allowNull: false,
    references: {model: Interview, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'CASCADE'
  }
}, Reminder._cleanAttributes), {
  VALID_TYPES: _.values(exports.TYPES)
}), exports);
// DEV: To prevent circular dependencies, we define parent/child relationships in model where foreign key is
//   Unfortunately, Application/ApplicationReminder both have foreign keys so we choose the stronger form
Interview._reminderKeys.forEach(function bindReminderKeyAssociation (key) {
  Interview.hasOne(InterviewReminder, {as: key});
});
InterviewReminder.belongsTo(Interview);
// Set up inherited bindings (e.g. Candidate)
Reminder._bindAssociations(InterviewReminder);
