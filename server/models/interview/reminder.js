// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var reminderUtils = require('../utils/reminder');

// Define instance methods for reminders
// DEV: These are quite bulky so we offload them to another file
exports.instanceMethods = {
  _buildReminder: function (typeKey, attrs) {
    // Resolve our variables
    var InterviewReminder = this.sequelize.models.interview_reminder;
    var candidateId = this.get('candidate_id'); assert(candidateId);
    var type = InterviewReminder.TYPES[typeKey]; assert(type);

    // Build and return our reminder
    return InterviewReminder.build(_.defaults({
      interview_id: this.get('id'),
      candidate_id: candidateId,
      type: type
    }, attrs));
  },

  createPreInterviewReminder: function (attrs) {
    // Create, set, and return our reminder
    var reminder = this._buildReminder('PRE_INTERVIEW', attrs);
    this.set('pre_interview_reminder_id', reminder.get('id'));
    this.setDataValue('pre_interview_reminder', reminder);
    return reminder;
  },
  updateOrReplacePreInterviewReminder: function (attrs) {
    // If the reminder has already been sent, create a new one
    var reminder = this.get('pre_interview_reminder');
    if (reminderUtils.shouldReplaceReminder(reminder, attrs)) {
      return this.createPreInterviewReminder(attrs);
    // Otherwise, update its values
    } else {
      reminder.set(attrs);
      return reminder;
    }
  },

  createPostInterviewReminder: function (attrs) {
    // Create, set, and return our reminder
    var reminder = this._buildReminder('POST_INTERVIEW',attrs);
    this.set('post_interview_reminder_id', reminder.get('id'));
    this.setDataValue('post_interview_reminder', reminder);
    return reminder;
  },
  updateOrReplacePostInterviewReminder: function (attrs) {
    var reminder = this.get('post_interview_reminder');
    if (reminderUtils.shouldReplaceReminder(reminder, attrs)) {
      return this.createPostInterviewReminder(attrs);
    } else {
      reminder.set(attrs);
      return reminder;
    }
  }
};
