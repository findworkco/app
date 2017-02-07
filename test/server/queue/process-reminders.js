// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');
var emails = require('../../../server/emails');
var Interview = require('../../../server/models/interview');
var InterviewReminder = require('../../../server/models/interview-reminder');
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

scenario.job('An upcoming interview application with enabled, matching, sendable, due, ' +
    'and unsent reminders being processed', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(emails, 'preInterviewReminder');
  sinonUtils.spy(emails, 'postInterviewReminder');
  serverUtils.stubEmails();
  before(function verifyNoWaitingForResponseReminder () {
    // DEV: By using a "waiting for response reminder"-less application, we verify we can tolerate missing data
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    expect(application.get('waiting_for_response_reminder_id')).to.equal(null);
  });
  processReminders();

  it('sends the reminder email', function () {
    // Verify email sent
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(2);

    // Verify email metadata
    var emailSendStubArgs = emailSendStub.args.slice().sort(function (argsA, argsB) {
      return argsB[0].data.subject.localeCompare(argsA[0].data.subject);
    });
    var data = emailSendStubArgs[0][0].data;
    expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
    expect(data.to).to.equal('mock-email@mock-domain.test');

    // Spot-check email content, trust email tests for deeper vetting
    expect(data.subject).to.equal('Pre-interview reminder for "Umbrella Corporation"');
    expect(data.html).to.contain('Hi mock-email@mock-domain.test,');
    expect(data.html).to.contain('https://findwork.test/application/abcdef-umbrella-corp-uuid');
    expect(data.html).to.not.contain('undefined');
    var preInterviewReminderSpy = emails.preInterviewReminder;
    expect(preInterviewReminderSpy.callCount).to.equal(1);
    expect(preInterviewReminderSpy.args[0][1]).to.have.property('application');
    expect(preInterviewReminderSpy.args[0][1]).to.have.property('interview');
    expect(preInterviewReminderSpy.args[0][1].interview.post_interview_reminder).to.be.an('object');
    expect(preInterviewReminderSpy.args[0][1]).to.have.property('email');

    // Verify similar setup for post interview reminder
    data = emailSendStubArgs[1][0].data;
    expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
    expect(data.to).to.equal('mock-email@mock-domain.test');
    expect(data.subject).to.equal('Post-interview reminder for "Umbrella Corporation"');
    expect(data.html).to.contain('Hi mock-email@mock-domain.test,');
    expect(data.html).to.contain('https://findwork.test/application/abcdef-umbrella-corp-uuid');
    expect(data.html).to.not.contain('undefined');
    var postInterviewReminderSpy = emails.postInterviewReminder;
    expect(postInterviewReminderSpy.callCount).to.equal(1);
    expect(postInterviewReminderSpy.args[0][1]).to.have.property('application');
    expect(postInterviewReminderSpy.args[0][1].application.waiting_for_response_reminder).to.be.an('object');
    expect(postInterviewReminderSpy.args[0][1].application).to.have.property('received_offer_reminder');
    expect(postInterviewReminderSpy.args[0][1].application).to.have.property('upcoming_interviews');
    expect(postInterviewReminderSpy.args[0][1]).to.have.property('interview');
    expect(postInterviewReminderSpy.args[0][1]).to.have.property('email');
  });

  it('marks the reminders as sent', function (done) {
    InterviewReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      expect(reminders[0].get('sent_at_datetime')).to.be.a('date');
      expect(reminders[1].get('sent_at_datetime')).to.be.a('date');
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

// SCENARIO: Due yet not sendable (e.g. past interviews)
scenario.job('Interview reminders that are enabled, due, matching, and unsent yet ' +
    'are unsendable being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_RECEIVED_OFFER_WITH_INTERVIEW_REMINDERS_DUE_YET_UNSENDABLE,
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
    InterviewReminder.findAll({where: {
      id: {$in: ['umbrella-corp-reminder-pre-int-uuid', 'umbrella-corp-reminder-post-int-uuid']}
    }}).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
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

scenario.job('Interview reminders that are enabled, due, sendable, and unsent yet ' +
    'have a non-matching status being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_ARCHIVED_WITH_INTERVIEW_REMINDERS_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  before(function sanityCheckFixtures () {
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    expect(interview.get('can_send_reminders')).to.equal(true);
  });
  serverUtils.stubEmails();
  processReminders();

  it('sends no emails', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });

  it('updates no reminders as sent', function (done) {
    InterviewReminder.findAll({where: {
      id: {$in: ['umbrella-corp-reminder-pre-int-uuid', 'umbrella-corp-reminder-post-int-uuid']}
    }}).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
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
    dbFixtures.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE_YET_DISABLED,
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

  it('updates no application reminders as sent', function (done) {
    // DEV: We ignore application reminder for upcoming interview as it was newly created
    ApplicationReminder.findAll({
      where: {application_id: {$not: 'abcdef-umbrella-corp-uuid'}}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
      expect(reminders[2].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });

  it('updates no interview reminders as sent', function (done) {
    InterviewReminder.findAll({
      where: {interview_id: 'abcdef-umbrella-corp-interview-uuid'}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });
});

// SCENARIO: Due yet sent status
scenario.job('Reminders that match status, are due, enabled yet are sent being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE_YET_SENT,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_YET_SENT,
    dbFixtures.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE_YET_SENT,
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

  it('updates doesn\'t update application reminder sent status', function (done) {
    // DEV: We ignore application reminder for upcoming interview as it was newly created
    ApplicationReminder.findAll({
      where: {application_id: {$not: 'abcdef-umbrella-corp-uuid'}}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      expect(reminders[0].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T09:30:00.000Z');
      expect(reminders[1].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T09:30:00.000Z');
      expect(reminders[2].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T09:30:00.000Z');
      done();
    });
  });

  it('updates doesn\'t update interview reminder sent status', function (done) {
    InterviewReminder.findAll({
      where: {interview_id: 'abcdef-umbrella-corp-interview-uuid'}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      expect(reminders[0].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T14:30:00.000Z');
      expect(reminders[1].get('sent_at_datetime').toISOString()).to.equal('2016-01-15T14:30:00.000Z');
      done();
    });
  });
});

// SCENARIO: Not due
scenario.job('Reminders that match status, are unsent, are enabled yet aren\'t due being processed', {
  dbFixtures: [
    dbFixtures.APPLICATION_SAVED_FOR_LATER_REMINDER_NOT_DUE,
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_NOT_DUE,
    dbFixtures.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_NOT_DUE,
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

  it('updates no application reminders as sent', function (done) {
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
      expect(reminders[2].get('sent_at_datetime')).to.equal(null);
      done();
    });
  });

  it('updates no interview reminders as sent', function (done) {
    InterviewReminder.findAll({
      where: {interview_id: 'abcdef-umbrella-corp-interview-uuid'}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      expect(reminders[0].get('sent_at_datetime')).to.equal(null);
      expect(reminders[1].get('sent_at_datetime')).to.equal(null);
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

// SCENARIO: Interview/application status
scenario.job('An upcoming due interview being processed', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(Interview.Instance.prototype, 'updateType');
  sinonUtils.spy(Interview.Instance.prototype, 'updateCanSendReminders');
  sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
  serverUtils.stubEmails();
  processReminders();

  it('updates the interview status', function (done) {
    Interview.findAll().asCallback(function handleFindAll (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(1);
      expect(interviews[0].get('type')).to.equal('past_interview');
      expect(interviews[0].get('can_send_reminders')).to.equal(true);
      done();
    });
  });

  it('updates the application status', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('status')).to.equal('waiting_for_response');
      expect(applications[0].get('waiting_for_response_reminder_id')).to.be.a('string');
      done();
    });
  });

  it('calls `Interview.updateType`', function () {
    // DEV: We use at least due to post interview reminder using same update logic
    var updateTypeSpy = Interview.Instance.prototype.updateType;
    expect(updateTypeSpy.callCount).to.be.at.least(1);
  });

  it('doesn\'t call `Interview.updateCanSendReminders`', function () {
    var updateCanSendRemindersSpy = Interview.Instance.prototype.updateCanSendReminders;
    expect(updateCanSendRemindersSpy.callCount).to.equal(0);
  });

  it('calls `Application.updateToInterviewChanges()`', function () {
    // DEV: We use at least due to post interview reminder using same update logic
    var updateToInterviewChangesSpy = Application.Instance.prototype.updateToInterviewChanges;
    expect(updateToInterviewChangesSpy.callCount).to.be.at.least(1);
  });
});

scenario.job('An upcoming yet not due interview being processed', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_NOT_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
  serverUtils.stubEmails();
  processReminders();

  // DEV: This verifies we don't waste part of our `limit`
  it('doesn\'t resolve models in our query', function () {
    var updateToInterviewChangesSpy = Application.Instance.prototype.updateToInterviewChanges;
    expect(updateToInterviewChangesSpy.callCount).to.equal(0);
  });

  it('doesn\'t update the interview status', function (done) {
    Interview.findAll().asCallback(function handleFindAll (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(1);
      expect(interviews[0].get('type')).to.equal('upcoming_interview');
      expect(interviews[0].get('can_send_reminders')).to.equal(true);
      done();
    });
  });

  it('doesn\'t update the application status', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('status')).to.equal('upcoming_interview');
      done();
    });
  });
});

scenario.job('A past interview being processed', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
  serverUtils.stubEmails();
  processReminders();

  // DEV: This verifies we don't waste part of our `limit`
  it('doesn\'t resolve models in our query', function () {
    var updateToInterviewChangesSpy = Application.Instance.prototype.updateToInterviewChanges;
    expect(updateToInterviewChangesSpy.callCount).to.equal(0);
  });

  it('doesn\'t update the interview status', function (done) {
    Interview.findAll().asCallback(function handleFindAll (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(1);
      expect(interviews[0].get('type')).to.equal('past_interview');
      done();
    });
  });

  it('doesn\'t update the application status', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('status')).to.equal('waiting_for_response');
      done();
    });
  });
});

// DEV: This prevents against naive queries only fetching due interviews instead of all upcoming interviews
scenario.job('An upcoming due interview with a sibling not due interview being processed', {
  dbFixtures: [dbFixtures.APPLICATION_SPLIT_UPCOMING_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  serverUtils.stubEmails();
  processReminders();

  it('updates the interview status', function (done) {
    Interview.findAll({order: [['type', 'DESC']]}).asCallback(function handleFindAll (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(2);
      expect(interviews[0].get('type')).to.equal('upcoming_interview');
      expect(interviews[0].get('can_send_reminders')).to.equal(true);
      expect(interviews[1].get('type')).to.equal('past_interview');
      expect(interviews[1].get('can_send_reminders')).to.equal(true);
      done();
    });
  });

  it('doesn\'t update the application status', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('status')).to.equal('upcoming_interview');
      done();
    });
  });
});

scenario.job('Multiple upcoming due interviews under the same application being processed', {
  dbFixtures: [dbFixtures.APPLICATION_MULTIPLE_UPCOMING_INTERVIEWS_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
  serverUtils.stubEmails();
  processReminders();

  it('updates the interview statuses', function (done) {
    Interview.findAll({order: [['type', 'DESC']]}).asCallback(function handleFindAll (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(2);
      expect(interviews[0].get('type')).to.equal('past_interview');
      expect(interviews[0].get('can_send_reminders')).to.equal(true);
      expect(interviews[1].get('type')).to.equal('past_interview');
      expect(interviews[1].get('can_send_reminders')).to.equal(true);
      done();
    });
  });

  it('updates the application status', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('status')).to.equal('waiting_for_response');
      done();
    });
  });

  it('updates the application once', function () {
    var updateToInterviewChangesSpy = Application.Instance.prototype.updateToInterviewChanges;
    expect(updateToInterviewChangesSpy.callCount).to.equal(1);
  });
});
