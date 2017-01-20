// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');

// Define instance methods for reminders
// DEV: These are quite bulky so we offload them to another file
exports.instanceMethods = {
  createSavedForLaterReminder: function (attrs) {
    // Sanity check there isn't a reminder yet (use `update` to perform updates)
    assert(!this.get('saved_for_later_reminder'));

    // Create, set, and return our reminder
    var ApplicationReminder = this.sequelize.models.application_reminder;
    var reminder = ApplicationReminder.build(_.defaults({
      application_id: this.get('id'),
      type: ApplicationReminder.TYPES.SAVED_FOR_LATER
    }, attrs));
    this.set('saved_for_later_reminder_id', reminder.get('id'));
    return reminder;
  },
  createWaitingForResponseReminder: function (attrs) {
    // Sanity check there isn't a reminder yet (use `update` to perform updates)
    assert(!this.get('waiting_for_response_reminder'));

    // Create, set, and return our reminder
    var ApplicationReminder = this.sequelize.models.application_reminder;
    var reminder = ApplicationReminder.build(_.defaults({
      application_id: this.get('id'),
      type: ApplicationReminder.TYPES.WAITING_FOR_RESPONSE
    }, attrs));
    this.set('waiting_for_response_reminder_id', reminder.get('id'));
    return reminder;
  },
  createReceivedOfferReminder: function (attrs) {
    // Sanity check there isn't a reminder yet (use `update` to perform updates)
    assert(!this.get('received_offer_reminder'));

    // Create, set, and return our reminder
    var ApplicationReminder = this.sequelize.models.application_reminder;
    var reminder = ApplicationReminder.build(_.defaults({
      application_id: this.get('id'),
      type: ApplicationReminder.TYPES.RECEIVED_OFFER
    }, attrs));
    this.set('received_offer_reminder_id', reminder.get('id'));
    return reminder;
  }
};
