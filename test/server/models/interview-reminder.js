// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var Candidate = require('../../../server/models/candidate');
var Interview = require('../../../server/models/interview');
var InterviewReminder = require('../../../server/models/interview-reminder');

// Start our tests
var validInterview = {
  candidate_id: 'mock-candidate-id',
  application_id: 'mock-application-id',
  date_time_moment: moment.tz('2017-01-31T12:34', 'US-America/Chicago')
};
var validBaseInterviewReminder = {
  candidate_id: 'mock-candidate-id',
  interview_id: 'mock-interview-id',
  is_enabled: true,
  date_time_moment: null, // Override in tests
  type: null // Override in tests
};
scenario.model('An InterviewReminder model without an interview being validated', function () {
  it('receives an error', function (done) {
    var interviewReminder = InterviewReminder.build(_.defaults({
      date_time_moment: moment.tz('2017-01-01T12:34', 'US-America/Chicago'),
      type: InterviewReminder.TYPES.PRE_INTERVIEW
    }, validBaseInterviewReminder));
    interviewReminder.validate().asCallback(function handleValidate (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'dateTimeMatchesInterview');
      expect(validationErr.errors[0].message).to.contain('Expected InterviewReminder to have loaded an interview');
      done();
    });
  });
});

scenario.model('An enabled pre-interview InterviewReminder model running after its interview being validated',
    function () {
  it('receives a validation error', function (done) {
    var interview = Interview.build(validInterview);
    var interviewReminder = InterviewReminder.build(_.defaults({
      is_enabled: true,
      date_time_moment: moment.tz('2017-02-01T12:34', 'US-America/Chicago'),
      type: InterviewReminder.TYPES.PRE_INTERVIEW
    }, validBaseInterviewReminder));
    interviewReminder.setDataValue('interview', interview);
    interviewReminder.validate().asCallback(function handleValidate (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'dateTimeMatchesInterview');
      expect(validationErr.errors[0].message).to.contain('Pre-interview reminder was set after interview');
      done();
    });
  });
});

scenario.model('A disabled pre-interview InterviewReminder model running after its interview being validated',
    function () {
  it('receives no validation errors', function (done) {
    var interview = Interview.build(validInterview);
    var interviewReminder = InterviewReminder.build(_.defaults({
      is_enabled: false,
      date_time_moment: moment.tz('2017-02-01T12:34', 'US-America/Chicago'),
      type: InterviewReminder.TYPES.PRE_INTERVIEW
    }, validBaseInterviewReminder));
    interviewReminder.setDataValue('interview', interview);
    interviewReminder.validate().asCallback(function handleValidate (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An enabled post-interview InterviewReminder model running before its interview being validated',
    function () {
  it('receives a validation error', function (done) {
    var interview = Interview.build(validInterview);
    var interviewReminder = InterviewReminder.build(_.defaults({
      is_enabled: true,
      date_time_moment: moment.tz('2017-01-01T12:34', 'US-America/Chicago'),
      type: InterviewReminder.TYPES.POST_INTERVIEW
    }, validBaseInterviewReminder));
    interviewReminder.setDataValue('interview', interview);
    interviewReminder.validate().asCallback(function handleValidate (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'dateTimeMatchesInterview');
      expect(validationErr.errors[0].message).to.contain('Post-interview reminder was set before interview');
      done();
    });
  });
});

scenario.model('A disabled post-interview InterviewReminder model running before its interview being validated',
    function () {
  it('receives no validation errors', function (done) {
    var interview = Interview.build(validInterview);
    var interviewReminder = InterviewReminder.build(_.defaults({
      is_enabled: false,
      date_time_moment: moment.tz('2017-01-01T12:34', 'US-America/Chicago'),
      type: InterviewReminder.TYPES.POST_INTERVIEW
    }, validBaseInterviewReminder));
    interviewReminder.setDataValue('interview', interview);
    interviewReminder.validate().asCallback(function handleValidate (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

// DEV: These tests verify our database requires candidate ids align between application/application reminder
scenario.model('An InterviewReminder model with a different candidate id from its Interview model', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
}, function () {
  it('cannot be saved due to rejection at the database level', function (done) {
    // DEV: We enforce this at the database level to prevent accidental bugs
    var reminder = this.models[dbFixtures.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY];
    reminder.setDataValue('candidate_id', 'alt00000-0000-0000-0000-000000000000');
    reminder.save({validate: false, _allowNoTransaction: true, _sourceType: 'server'}).asCallback(
        function handleSave (err) {
      expect(err).to.not.equal(null);
      expect(err.name).to.equal('SequelizeForeignKeyConstraintError');
      expect(err.original.detail).to.contain('Key (interview_id, candidate_id)=');
      expect(err.original.detail).to.contain('is not present in table "interviews"');
      done();
    });
  });
});

// DEV: This test verifies our database has proper cascading deletion hooks
scenario.model('An InterviewReminder model being deleted', {
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
  before(function verifyInterviewRemindersExist (done) {
    InterviewReminder.findAll().asCallback(function verifyInterviewRemindersExistFn (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(2);
      done();
    });
  });

  it('prevents application reminder deletion', function (done) {
    var reminder = InterviewReminder.build({id: 'umbrella-corp-reminder-pre-int-uuid'});
    reminder.destroy({_sourceType: 'server'}).asCallback(function handleDestroy (err) {
      expect(err).to.not.equal(null);
      expect(err.message).to.contain('delete on table "interview_reminders" violates foreign key constraint ' +
        '"interviews_pre_interview_reminder_id_fkey"');
      done();
    });
  });
});
