// Load in our dependencies
var assert = require('assert');
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
  VALID_TYPES: _.values(exports.TYPES),
  validate: {
    // DEV: We skip this validation by default on fixture create in `utils/test` as models are standalone
    dateTimeMatchesInterview: function () {
      // Verify we have an interview
      var interview = this.get('interview');
      assert(interview, 'Expected InterviewReminder to have loaded an interview. ' +
        'No updates should occur without being bound to an interview');

      // If our reminder is disabled, stop checking
      if (this.getDataValue('is_enabled') === false) {
        return;
      }

      // If we are before an interview, verify our date time is before the interview
      var reminderMoment = this.get('date_time_moment');
      var interviewMoment = interview.get('date_time_moment');
      if (this.getDataValue('type') === exports.TYPES.PRE_INTERVIEW) {
        if (reminderMoment.isAfter(interviewMoment)) {
          throw new Error('Pre-interview reminder was set after interview');
        }
      // Otherwise, if we are after an interview, verify our date time is after the interview
      } else if (this.getDataValue('type') === exports.TYPES.POST_INTERVIEW) {
        if (reminderMoment.isBefore(interviewMoment)) {
          throw new Error('Post-interview reminder was set before interview');
        }
      // Otherwise, complain and leave
      } else {
        throw new Error('Unexpected InterviewReminder type received');
      }
    }
  }
}), exports);
// DEV: To prevent circular dependencies, we define parent/child relationships in model where foreign key is
//   Unfortunately, Application/ApplicationReminder both have foreign keys so we choose the stronger form
Interview._reminderKeys.forEach(function bindReminderKeyAssociation (key) {
  Interview.hasOne(InterviewReminder, {as: key});
});
InterviewReminder.belongsTo(Interview);
// Set up inherited bindings (e.g. Candidate)
Reminder._bindAssociations(InterviewReminder);
