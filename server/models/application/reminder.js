// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var reminderUtils = require('../utils/reminder');

// Define instance methods for reminders
// DEV: These are quite bulky so we offload them to another file
exports.instanceMethods = {
  _buildReminder: function (typeKey, attrs) {
    // Resolve our variables
    var ApplicationReminder = this.sequelize.models.application_reminder;
    var candidateId = this.get('candidate_id'); assert(candidateId);
    var type = ApplicationReminder.TYPES[typeKey]; assert(type);

    // Build and return our reminder
    return ApplicationReminder.build(_.defaults({
      application_id: this.get('id'),
      candidate_id: candidateId,
      type: type
    }, attrs));
  },

  createSavedForLaterReminder: function (attrs) {
    // Create, set, and return our reminder
    var reminder = this._buildReminder('SAVED_FOR_LATER', attrs);
    this.set('saved_for_later_reminder_id', reminder.get('id'));
    this.setDataValue('saved_for_later_reminder', reminder);
    return reminder;
  },
  updateOrReplaceSavedForLaterReminder: function (attrs) {
    // If the reminder has already been sent, create a new one
    var reminder = this.get('saved_for_later_reminder');
    if (reminderUtils.shouldReplaceReminder(reminder, attrs)) {
      return this.createSavedForLaterReminder(attrs);
    // Otherwise, update its values
    } else {
      reminder.set(attrs);
      return reminder;
    }
  },

  createWaitingForResponseReminder: function (attrs) {
    var reminder = this._buildReminder('WAITING_FOR_RESPONSE', attrs);
    this.set('waiting_for_response_reminder_id', reminder.get('id'));
    this.setDataValue('waiting_for_response_reminder', reminder);
    return reminder;
  },
  updateOrReplaceWaitingForResponseReminder: function (attrs) {
    var reminder = this.get('waiting_for_response_reminder');
    if (reminderUtils.shouldReplaceReminder(reminder, attrs)) {
      return this.createWaitingForResponseReminder(attrs);
    } else {
      reminder.set(attrs);
      return reminder;
    }
  },

  createReceivedOfferReminder: function (attrs) {
    var reminder = this._buildReminder('RECEIVED_OFFER', attrs);
    this.set('received_offer_reminder_id', reminder.get('id'));
    this.setDataValue('received_offer_reminder', reminder);
    return reminder;
  },
  updateOrReplaceReceivedOfferReminder: function (attrs) {
    var reminder = this.get('received_offer_reminder');
    if (reminderUtils.shouldReplaceReminder(reminder, attrs)) {
      return this.createReceivedOfferReminder(attrs);
    } else {
      reminder.set(attrs);
      return reminder;
    }
  }
};
