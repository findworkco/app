// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var Candidate = require('../../../server/models/candidate');
var Interview = require('../../../server/models/interview');
var InterviewReminder = require('../../../server/models/interview-reminder');
var Reminder = require('../../../server/models/reminder');

// Start our tests
scenario.model('An Interview model', function () {
  it.skip('requires `date_time` to be non-empty', function () {
    var interview = Interview.build({});
    expect(interview).to.equal(false);
  });

  it.skip('requires `pre_interview_reminder` to be null or before `date_time`', function () {
    var interview = Interview.build({});
    expect(interview).to.equal(false);
  });
  it.skip('requires `post_interview_reminder` to be null or after `date_time`', function () {
    var interview = Interview.build({});
    expect(interview).to.equal(false);
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
