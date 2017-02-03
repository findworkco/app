// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var ApplicationReminder = require('../../../server/models/application-reminder');
var emails = require('../../../server/emails');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');
var queue = require('../../../server/queue');

// Define a helper for our tests
function processReminders() {
  before(function processRemindersFn (done) {
    var job = queue.create(queue.JOBS.PROCESS_REMINDERS).save(function (err) {
      if (err) {
        throw err;
      }
    });
    job.on('complete', function (jobData) { done(); });
  });
}

// Start our tests
// SCENARIO: Reminders that should send
scenario.job('A saved for later application with enabled, matching, due, and unsent reminder being processed', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(emails, 'savedForLaterReminder');
  serverUtils.stubEmails();
  processReminders();

  it('sends the reminder email', function () {
    // Verify email sent
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(1);

    // Verify email metadata
    var data = emailSendStub.args[0][0].data;
    expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
    expect(data.to).to.equal('mock-email@mock-domain.test');

    // Spot-check email content, trust email tests for deeper vetting
    expect(data.subject).to.equal('Application reminder for "Intertrode"');
    expect(data.html).to.contain('Hi mock-email@mock-domain.test,');
    expect(data.html).to.contain('https://findwork.test/application/abcdef-intertrode-uuid');
    expect(data.html).to.not.contain('undefined');
    var savedForLaterReminderSpy = emails.savedForLaterReminder;
    expect(savedForLaterReminderSpy.callCount).to.equal(1);
    expect(savedForLaterReminderSpy.args[0][1]).to.have.property('application');
    expect(savedForLaterReminderSpy.args[0][1]).to.have.property('email');
  });

  it('marks the reminder as sent', function (done) {
    // Retrieve our reminder
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      // Verify the flag is set now
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('sent_at_datetime')).to.be.a('date');
      done();
    });
  });
});

scenario.job('A waiting for response application with enabled, matching, due, ' +
    'and unsent reminder being processed', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(emails, 'waitingForResponseReminder');
  serverUtils.stubEmails();
  processReminders();

  it('sends the reminder email', function () {
    // Verify email sent
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(1);

    // Verify email metadata
    var data = emailSendStub.args[0][0].data;
    expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
    expect(data.to).to.equal('mock-email@mock-domain.test');

    // Spot-check email content, trust email tests for deeper vetting
    expect(data.subject).to.equal('Follow-up reminder for "Sky Networks"');
    expect(data.html).to.contain('Hi mock-email@mock-domain.test,');
    expect(data.html).to.contain('https://findwork.test/application/abcdef-sky-networks-uuid');
    expect(data.html).to.not.contain('undefined');
    var waitingForResponseReminderSpy = emails.waitingForResponseReminder;
    expect(waitingForResponseReminderSpy.callCount).to.equal(1);
    expect(waitingForResponseReminderSpy.args[0][1]).to.have.property('application');
    expect(waitingForResponseReminderSpy.args[0][1]).to.have.property('email');
  });

  it('marks the reminder as sent', function (done) {
    // Retrieve our reminder
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      // Verify the flag is set now
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('sent_at_datetime')).to.be.a('date');
      done();
    });
  });
});

scenario.job('A received offer application with enabled, matching, due, ' +
    'and unsent reminder being processed', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER_REMINDER_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(emails, 'receivedOfferReminder');
  serverUtils.stubEmails();
  processReminders();

  it('sends the reminder email', function () {
    // Verify email sent
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(1);

    // Verify email metadata
    var data = emailSendStub.args[0][0].data;
    expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
    expect(data.to).to.equal('mock-email@mock-domain.test');

    // Spot-check email content, trust email tests for deeper vetting
    expect(data.subject).to.equal('Response reminder for "Black Mesa"');
    expect(data.html).to.contain('Hi mock-email@mock-domain.test,');
    expect(data.html).to.contain('https://findwork.test/application/abcdef-black-mesa-uuid');
    expect(data.html).to.not.contain('undefined');
    var receivedOfferReminderSpy = emails.receivedOfferReminder;
    expect(receivedOfferReminderSpy.callCount).to.equal(1);
    expect(receivedOfferReminderSpy.args[0][1]).to.have.property('application');
    expect(receivedOfferReminderSpy.args[0][1]).to.have.property('email');
  });

  it('marks the reminder as sent', function (done) {
    // Retrieve our reminder
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      // Verify the flag is set now
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('sent_at_datetime')).to.be.a('date');
      done();
    });
  });
});

// SCENARIO: Due yet non-matching status
scenario.job('A saved for later reminder that is enabled, due, and unsent yet ' +
    'has a non-matching status being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_WITH_SAVED_FOR_LATER_REMINDER_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  before(function sanityCheckFixtures () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    expect(application.get('status')).to.equal('waiting_for_response');
    expect(application.get('saved_for_later_reminder_id')).to.be.a('string');
  });
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates no reminders as sent', function (done) {
    ApplicationReminder.findAll({where: {
      application_id: 'abcdef-sky-networks-uuid',
      id: 'abcdef-intertrode-reminder-uuid'
    }}).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });
});

scenario.job('A waiting for response reminder that is enabled, due, and unsent yet ' +
    'has a non-matching status being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_RECEIVED_OFFER_WITH_WAITING_FOR_RESPONSE_REMINDER_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  before(function sanityCheckFixtures () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(application.get('status')).to.equal('received_offer');
    expect(application.get('waiting_for_response_reminder_id')).to.be.a('string');
  });
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates no reminders as sent', function (done) {
    ApplicationReminder.findAll({where: {
      application_id: 'abcdef-black-mesa-uuid',
      id: 'abcdef-sky-networks-reminder-uuid'
    }}).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });
});

scenario.job('A received offer reminder that is enabled, due, and unsent yet ' +
    'has a non-matching status being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_WITH_RECEIVED_OFFER_REMINDER_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  before(function sanityCheckFixtures () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    expect(application.get('status')).to.equal('waiting_for_response');
    expect(application.get('received_offer_reminder_id')).to.be.a('string');
  });
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates no reminders as sent', function (done) {
    // Retrieve our reminder
    ApplicationReminder.findAll({where: {
      application_id: 'abcdef-sky-networks-uuid',
      id: 'abcdef-black-mesa-reminder-uuid'
    }}).asCallback(function handleFindAll (err, reminders) {
      // Verify the flag is set now
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });
});

// SCENARIO: Due yet disabled status
scenario.job('Reminders that match status, are due, and are unsent yet ' +
    'are disabled being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE_YET_DISABLED,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_YET_DISABLED,
    dbFixtures.APPLICATION_RECEIVED_OFFER_REMINDER_DUE_YET_DISABLED,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates no reminders as sent', function (done) {
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
      expect(reminders[2].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });
});

// SCENARIO: Due yet sent status
scenario.job('Reminders that match status, are due, enabled yet are sent being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE_YET_SENT,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_YET_SENT,
    dbFixtures.APPLICATION_RECEIVED_OFFER_REMINDER_DUE_YET_SENT,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates doesn\'t update reminder sent status', function (done) {
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      expect(reminders[0].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T09:30:00.000Z');
      expect(reminders[1].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T09:30:00.000Z');
      expect(reminders[2].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T09:30:00.000Z');
      done();
    });
  });
});

// SCENARIO: Not due
scenario.job('Reminders that match status, are unsent, are enabled yet aren\'t due being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_NOT_DUE,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_NOT_DUE,
    dbFixtures.APPLICATION_RECEIVED_OFFER_REMINDER_NOT_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates no reminders as sent', function (done) {
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
      expect(reminders[2].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });
});

// SCENARIO: Batch processing
scenario.job('Reminders that are due and within the batch size being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE,
    dbFixtures.APPLICATION_RECEIVED_OFFER_REMINDER_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  sinonUtils.spy(queue, '_triggerProcessReminders');
  serverUtils.stubEmails();
  processReminders();
  before(function waitForPotentialOverrun (done) {
    setTimeout(done, 100);
  });

  it('doesn\'t trigger more reminder processing', function () {
    var triggerProcessRemindersSpy = queue._triggerProcessReminders;
    expect(triggerProcessRemindersSpy.callCount).to.equal(0);
  });
});

scenario.job('Reminders that are due but exceed the batch size being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_2,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  sinonUtils.swap(queue, 'PROCESS_REMINDERS_BATCH_SIZE', 1);
  sinonUtils.spy(queue, '_triggerProcessReminders');
  serverUtils.stubEmails();
  processReminders();
  before(function waitForPotentialOverrun (done) {
    setTimeout(done, 100);
  });

  it('triggers more reminder processing', function () {
    var triggerProcessRemindersSpy = queue._triggerProcessReminders;
    expect(triggerProcessRemindersSpy.callCount).to.equal(1);
  });
});