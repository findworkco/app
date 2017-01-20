// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');

// Define instance methods for reminders
// DEV: These are quite bulky so we offload them to another file
exports.instanceMethods = {
  createPreInterviewReminder: function (attrs) {
    // Sanity check there isn't a reminder yet (use `update` to perform updates)
    assert(!this.get('pre_interview_reminder'));

    // Create, set, and return our reminder
    var InterviewReminder = this.sequelize.models.interview_reminder;
    var reminder = InterviewReminder.build(_.defaults({
      interview_id: this.get('id'),
      type: InterviewReminder.TYPES.PRE_INTERVIEW
    }, attrs));
    this.set('pre_interview_reminder_id', reminder.get('id'));
    return reminder;
  },
  createPostInterviewReminder: function (attrs) {
    // Sanity check there isn't a reminder yet (use `update` to perform updates)
    assert(!this.get('post_interview_reminder'));

    // Create, set, and return our reminder
    var InterviewReminder = this.sequelize.models.interview_reminder;
    var reminder = InterviewReminder.build(_.defaults({
      interview_id: this.get('id'),
      type: InterviewReminder.TYPES.POST_INTERVIEW
    }, attrs));
    this.set('post_interview_reminder_id', reminder.get('id'));
    return reminder;
  }
};
