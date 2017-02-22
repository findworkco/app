// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../../utils/db-fixtures');
var ApplicationReminder = require('../../../../server/models/application-reminder');
var reminderUtils = require('../../../../server/models/utils/reminder');
var sinonUtils = require('../../../utils/sinon');

// Start our tests
function reloadSavedForLaterApplication() {
  before(function reloadApplicationWithReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    application.reload({include: [{model: ApplicationReminder, as: 'saved_for_later_reminder'}]}).asCallback(done);
  });
}
scenario.model('An Application model updating an unsent saved for later reminder', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadSavedForLaterApplication();
  sinonUtils.spy(reminderUtils, 'shouldReplaceReminder');

  it('updates the reminder', function () {
    // Verify original state
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    var originalReminder = application.get('saved_for_later_reminder');
    expect(originalReminder.get('sent_at_moment')).to.equal(null);
    expect(originalReminder.get('is_enabled')).to.equal(true);
    expect(originalReminder.get('date_time_datetime').toISOString()).to.equal('2022-06-20T17:00:00.000Z');
    expect(originalReminder.get('date_time_timezone')).to.equal('US-America/Chicago');

    // Update our reminder and assert
    application.updateOrReplaceSavedForLaterReminder({
      is_enabled: false,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });
    expect(originalReminder.get('is_enabled')).to.equal(false);
    expect(originalReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(originalReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
    var shouldReplaceReminderSpy = reminderUtils.shouldReplaceReminder;
    expect(shouldReplaceReminderSpy.callCount).to.equal(1);
  });
});

scenario.model('An Application model updating a sent yet unchanged saved for later reminder', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadSavedForLaterApplication();

  it('doesn\'t replace the reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('saved_for_later_reminder_id')).to.equal('abcdef-intertrode-reminder-uuid');
    application.get('saved_for_later_reminder').set('sent_at_moment', moment());
    application.updateOrReplaceSavedForLaterReminder({
      is_enabled: true
    });
    expect(application.get('saved_for_later_reminder_id')).to.equal('abcdef-intertrode-reminder-uuid');
  });
});

scenario.model('An Application model updating a sent and changed saved for later reminder', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadSavedForLaterApplication();

  it('replaces the reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('saved_for_later_reminder_id')).to.equal('abcdef-intertrode-reminder-uuid');

    application.get('saved_for_later_reminder').set('sent_at_moment', moment());
    var newReminder = application.updateOrReplaceSavedForLaterReminder({
      is_enabled: false,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });

    expect(application.get('saved_for_later_reminder_id')).to.be.a('string');
    expect(application.get('saved_for_later_reminder_id')).to.not.equal('abcdef-intertrode-reminder-uuid');
    expect(newReminder.get('application_id')).to.equal('abcdef-intertrode-uuid');
    expect(newReminder.get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
    expect(newReminder.get('is_enabled')).to.equal(false);
    expect(newReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(newReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
  });
});

function reloadWaitingForResponseApplication() {
  before(function reloadApplicationWithReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    application.reload({include: [{model: ApplicationReminder, as: 'waiting_for_response_reminder'}]}).asCallback(done);
  });
}
scenario.model('An Application model updating an unsent waiting for response reminder', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadWaitingForResponseApplication();
  sinonUtils.spy(reminderUtils, 'shouldReplaceReminder');

  it('updates the reminder', function () {
    // Verify original state
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var originalReminder = application.get('waiting_for_response_reminder');
    expect(originalReminder.get('sent_at_moment')).to.equal(null);
    expect(originalReminder.get('is_enabled')).to.equal(true);
    expect(originalReminder.get('date_time_datetime').toISOString()).to.equal('2022-01-25T18:00:00.000Z');
    expect(originalReminder.get('date_time_timezone')).to.equal('US-America/Chicago');

    // Update our reminder and assert
    application.updateOrReplaceWaitingForResponseReminder({
      is_enabled: false,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });
    expect(originalReminder.get('is_enabled')).to.equal(false);
    expect(originalReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(originalReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
    var shouldReplaceReminderSpy = reminderUtils.shouldReplaceReminder;
    expect(shouldReplaceReminderSpy.callCount).to.equal(1);
  });
});

scenario.model('An Application model updating a sent yet unchanged waiting for response reminder', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadWaitingForResponseApplication();

  it('doesn\'t replace the reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    expect(application.get('waiting_for_response_reminder_id')).to.equal('abcdef-sky-networks-reminder-uuid');
    application.get('waiting_for_response_reminder').set('sent_at_moment', moment());
    application.updateOrReplaceWaitingForResponseReminder({
      is_enabled: true
    });
    expect(application.get('waiting_for_response_reminder_id')).to.equal('abcdef-sky-networks-reminder-uuid');
  });
});

scenario.model('An Application model updating a sent and changed waiting for response reminder', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadWaitingForResponseApplication();

  it('replaces the reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    expect(application.get('waiting_for_response_reminder_id')).to.equal('abcdef-sky-networks-reminder-uuid');

    application.get('waiting_for_response_reminder').set('sent_at_moment', moment());
    var newReminder = application.updateOrReplaceWaitingForResponseReminder({
      is_enabled: false,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });

    expect(application.get('waiting_for_response_reminder_id')).to.be.a('string');
    expect(application.get('waiting_for_response_reminder_id')).to.not.equal('abcdef-sky-networks-reminder-uuid');
    expect(newReminder.get('application_id')).to.equal('abcdef-sky-networks-uuid');
    expect(newReminder.get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
    expect(newReminder.get('is_enabled')).to.equal(false);
    expect(newReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(newReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
  });
});

function reloadReceivedOfferApplication() {
  before(function reloadApplicationWithReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.reload({include: [{model: ApplicationReminder, as: 'received_offer_reminder'}]}).asCallback(done);
  });
}
scenario.model('An Application model updating an unsent received offer reminder', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadReceivedOfferApplication();
  sinonUtils.spy(reminderUtils, 'shouldReplaceReminder');

  it('updates the reminder', function () {
    // Verify original state
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var originalReminder = application.get('received_offer_reminder');
    expect(originalReminder.get('sent_at_moment')).to.equal(null);
    expect(originalReminder.get('is_enabled')).to.equal(true);
    expect(originalReminder.get('date_time_datetime').toISOString()).to.equal('2022-01-01T18:00:00.000Z');
    expect(originalReminder.get('date_time_timezone')).to.equal('US-America/Chicago');

    // Update our reminder and assert
    application.updateOrReplaceReceivedOfferReminder({
      is_enabled: false,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });
    expect(originalReminder.get('is_enabled')).to.equal(false);
    expect(originalReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(originalReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
    var shouldReplaceReminderSpy = reminderUtils.shouldReplaceReminder;
    expect(shouldReplaceReminderSpy.callCount).to.equal(1);
  });
});

scenario.model('An Application model updating a sent yet unchanged received offer reminder', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadReceivedOfferApplication();

  it('doesn\'t replace the reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(application.get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');
    application.get('received_offer_reminder').set('sent_at_moment', moment());
    application.updateOrReplaceReceivedOfferReminder({
      is_enabled: true
    });
    expect(application.get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');
  });
});

scenario.model('An Application model updating a sent and changed received offer reminder', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadReceivedOfferApplication();

  it('replaces the reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(application.get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');

    application.get('received_offer_reminder').set('sent_at_moment', moment());
    var newReminder = application.updateOrReplaceReceivedOfferReminder({
      is_enabled: false,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });

    expect(application.get('received_offer_reminder_id')).to.be.a('string');
    expect(application.get('received_offer_reminder_id')).to.not.equal('abcdef-black-mesa-reminder-uuid');
    expect(newReminder.get('application_id')).to.equal('abcdef-black-mesa-uuid');
    expect(newReminder.get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
    expect(newReminder.get('is_enabled')).to.equal(false);
    expect(newReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(newReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
  });
});
