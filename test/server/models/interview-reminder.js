// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var Candidate = require('../../../server/models/candidate');
var Interview = require('../../../server/models/interview');
var InterviewReminder = require('../../../server/models/interview-reminder');

// Start our tests
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
