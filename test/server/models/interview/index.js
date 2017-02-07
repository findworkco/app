// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../../utils/db-fixtures');
var Application = require('../../../../server/models/application');
var Candidate = require('../../../../server/models/candidate');
var Interview = require('../../../../server/models/interview');
var InterviewReminder = require('../../../../server/models/interview-reminder');
var Reminder = require('../../../../server/models/reminder');
var sinonUtils = require('../../utils/sinon');

// Start our tests
scenario.model('An Interview model with an upcoming datetime', function () {
  sinonUtils.spy(Interview.Instance.prototype, 'updateType');
  sinonUtils.spy(Interview.Instance.prototype, 'updateCanSendReminders');

  it('automatically receives its expected type and can send reminders', function () {
    var interview = Interview.build({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    });
    expect(interview.get('type')).to.equal('upcoming_interview');
    expect(interview.get('can_send_reminders')).to.equal(true);

    var updateTypeSpy = Interview.Instance.prototype.updateType;
    expect(updateTypeSpy.callCount).to.equal(1);
    var updateCanSendRemindersSpy = Interview.Instance.prototype.updateCanSendReminders;
    expect(updateCanSendRemindersSpy.callCount).to.equal(1);
  });
});

scenario.model('An Interview model with a past datetime', function () {
  sinonUtils.spy(Interview.Instance.prototype, 'updateType');
  sinonUtils.spy(Interview.Instance.prototype, 'updateCanSendReminders');

  it('automatically receives its expected type and can send reminders', function () {
    var interview = Interview.build({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    });
    expect(interview.get('type')).to.equal('past_interview');
    expect(interview.get('can_send_reminders')).to.equal(false);

    var updateTypeSpy = Interview.Instance.prototype.updateType;
    expect(updateTypeSpy.callCount).to.equal(1);
    var updateCanSendRemindersSpy = Interview.Instance.prototype.updateCanSendReminders;
    expect(updateCanSendRemindersSpy.callCount).to.equal(1);
  });
});

// Direct setting
scenario.model('An Interview model setting type directly', function () {
  it('is rejected', function () {
    var interview = Interview.build({});
    expect(function setInterviewType () {
      interview.set('type', 'upcoming_interview');
    }).to.throw(Error, /`type` cannot be set directly/);
  });
});

scenario.model('An Interview model setting can_send_reminders directly', function () {
  it('is rejected', function () {
    var interview = Interview.build({});
    expect(function setInterviewCanSendReminders () {
      interview.set('can_send_reminders', 'upcoming_interview');
    }).to.throw(Error, /`can_send_reminders` cannot be set directly/);
  });
});

// Validation
// typeMatchesDateTime
var validBaseInterview = {
  candidate_id: 'mock-candidate-id',
  application_id: 'mock-application-id',
  details: 'Mock details',
  pre_interview_reminder_id: 'mock-pre-reminder-id',
  post_interview_reminder_id: 'mock-post-reminder-id'
};
var typeMatchesDateTimeSkip = ['applicationStatusMatchesType', 'typeMatchesCanSendReminders'];
scenario.model('An upcoming Interview model with a matching type', function () {
  it('receives has no validation errors', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    interview.setDataValue('type', 'upcoming_interview');
    interview.validate({skip: typeMatchesDateTimeSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An upcoming Interview model with a non-matching type', function () {
  it('receives a validation error', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    interview.setDataValue('type', 'past_interview');
    interview.validate({skip: typeMatchesDateTimeSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'typeMatchesDateTime');
      expect(validationErr.errors[0].message).to.contain('Expected type for upcoming interview');
      done();
    });
  });
});

scenario.model('An past Interview model with a matching type', function () {
  it('receives has no validation errors', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    interview.setDataValue('type', 'past_interview');
    interview.validate({skip: typeMatchesDateTimeSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An past Interview model with a non-matching type', function () {
  it('receives a validation error', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    interview.setDataValue('type', 'upcoming_interview');
    interview.validate({skip: typeMatchesDateTimeSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'typeMatchesDateTime');
      expect(validationErr.errors[0].message).to.contain('Expected type for past interview');
      done();
    });
  });
});

// typeMatchesCanSendReminders
var typeMatchesCanSendRemindersSkip = ['applicationStatusMatchesType'];
scenario.model('An upcoming Interview model that can send reminders', function () {
  it('receives has no validation errors', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    expect(interview.get('type')).to.equal('upcoming_interview');
    interview.setDataValue('can_send_reminders', true);
    interview.validate({skip: typeMatchesCanSendRemindersSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An upcoming Interview model that cannot send reminders', function () {
  it('receives a validation error', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    expect(interview.get('type')).to.equal('upcoming_interview');
    interview.setDataValue('can_send_reminders', false);
    interview.validate({skip: typeMatchesCanSendRemindersSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'typeMatchesCanSendReminders');
      expect(validationErr.errors[0].message).to.contain(
        'Expected can_send_reminders for upcoming interview to be true');
      done();
    });
  });
});

scenario.model('A past Interview model that can send reminders', function () {
  it('receives has no validation errors', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    expect(interview.get('type')).to.equal('past_interview');
    interview.setDataValue('can_send_reminders', true);
    interview.validate({skip: typeMatchesCanSendRemindersSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A past Interview model that cannot send reminders', function () {
  it('receives has no validation errors', function (done) {
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    expect(interview.get('type')).to.equal('past_interview');
    interview.setDataValue('can_send_reminders', false);
    interview.validate({skip: typeMatchesCanSendRemindersSkip}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

// applicationStatusMatchesType
scenario.model('An Interview model with an Application model and interview insensitive status', function () {
  sinonUtils.spy(Application.options.validate, 'statusMatchesInterviews');

  it('receives has no validation errors', function (done) {
    var application = Application.build({
      status: 'received_offer'
    });
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    application.setDataValue('interviews', [interview]);
    interview.setDataValue('application', application);

    interview.validate().asCallback(function handleError (err, validationErr) {
      // Perform our assertions
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);

      // Additionally verify we call an Application validator so we know it'll work on both sides
      var statusMatchesInterviewsSpy = Application.options.validate.statusMatchesInterviews;
      expect(statusMatchesInterviewsSpy.callCount).to.equal(1);

      // Callback
      done();
    });
  });
});

scenario.model('A past Interview model with an Application model and a past-representative status', function () {
  it('receives has no validation errors', function (done) {
    var application = Application.build({
      status: 'waiting_for_response'
    });
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    application.setDataValue('interviews', [interview]);
    interview.setDataValue('application', application);

    interview.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A past Interview model with an Application model and an upcoming-representative status',
    function () {
  it('receives a validation error', function (done) {
    var application = Application.build({
      status: 'upcoming_interview'
    });
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2016-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    application.setDataValue('interviews', [interview]);
    interview.setDataValue('application', application);

    interview.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'applicationStatusMatchesType');
      expect(validationErr.errors[0].message).to.contain(
        'Expected upcoming interview application to have upcoming interviews');
      done();
    });
  });
});

scenario.model('An upcoming Interview model with an Application model and an upcoming-representative status',
    function () {
  it('receives has no validation errors', function (done) {
    var application = Application.build({
      status: 'upcoming_interview'
    });
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    application.setDataValue('interviews', [interview]);
    interview.setDataValue('application', application);

    interview.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An upcoming Interview model with an Application model and a past-representative status',
    function () {
  it('receives a validation error', function (done) {
    var application = Application.build({
      status: 'waiting_for_response'
    });
    var interview = Interview.build(_.defaults({
      date_time_moment: moment.tz('2022-01-04T03:04', 'US-America/Chicago')
    }, validBaseInterview));
    application.setDataValue('interviews', [interview]);
    interview.setDataValue('application', application);

    interview.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'applicationStatusMatchesType');
      expect(validationErr.errors[0].message).to.contain(
        'Expected non-upcoming interview application to have no upcoming interviews');
      done();
    });
  });
});

// Relationships
scenario.model('An Interview model with reminders', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function loadApplicationWithIncludes (done) {
    this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY].reload({
      include: [
        {model: InterviewReminder, as: 'pre_interview_reminder'},
        {model: InterviewReminder, as: 'post_interview_reminder'}
      ]
    }).asCallback(done);
  });

  it('loads separate pre/post interview reminders', function () {
    var application = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    expect(application.get('post_interview_reminder')).to.not.equal(null);
    expect(application.get('post_interview_reminder')).to.not.equal(null);
    expect(application.get('pre_interview_reminder').get('id')).to.not.equal(
      application.get('post_interview_reminder').get('id'));
  });
});

// DEV: These tests verify our database requires candidate ids align between application/interview
scenario.model('An Interview model with a different candidate id from its Application model', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
}, function () {
  it('cannot be saved due to rejection at the database level', function (done) {
    // DEV: We enforce this at the database level to prevent accidental bugs
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    interview.setDataValue('candidate_id', 'alt00000-0000-0000-0000-000000000000');
    interview.save({validate: false, _allowNoTransaction: true, _sourceType: 'server'}).asCallback(
        function handleSave (err) {
      expect(err).to.not.equal(null);
      expect(err.name).to.equal('SequelizeForeignKeyConstraintError');
      expect(err.original.detail).to.contain('Key (application_id, candidate_id)=');
      expect(err.original.detail).to.contain('is not present in table "applications"');
      done();
    });
  });
});

// DEV: This test verifies our database has proper cascading deletion hooks
scenario.model('An Interview model being deleted which has reminders', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function verifyCandidateExists (done) {
    Candidate.findAll().asCallback(function verifyCandidateExistsFn (err, candidates) {
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      done();
    });
  });
  before(function verifyApplicationsExist (done) {
    Application.findAll().asCallback(function verifyApplicationsExistFn (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      done();
    });
  });
  before(function verifyInterviewsExist (done) {
    Interview.findAll().asCallback(function verifyInterviewsExistFn (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(1);
      done();
    });
  });
  before(function verifyRemindersExist (done) {
    Reminder.findAll().asCallback(function verifyRemindersExistFn (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      done();
    });
  });
  before(function deleteInterview (done) {
    var interview = Interview.build({id: 'abcdef-umbrella-corp-interview-uuid'});
    interview.destroy({_sourceType: 'server', _allowNoTransaction: true}).asCallback(done);
  });

  it('doesn\'t delete candidate', function (done) {
    Candidate.findAll().asCallback(function verifyCandidateExistsFn (err, candidates) {
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      done();
    });
  });
  it('doesn\'t delete application', function (done) {
    Application.findAll().asCallback(function verifyApplicationsDeletedFn (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      done();
    });
  });
  it('deletes interviews', function (done) {
    Interview.findAll().asCallback(function verifyInterviewsDeletedFn (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(0);
      done();
    });
  });
  it('deletes reminders', function (done) {
    Reminder.findAll().asCallback(function verifyRemindersDeletedFn (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(0);
      done();
    });
  });
});
