// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var Candidate = require('../../../server/models/candidate');
var ApplicationReminder = require('../../../server/models/application-reminder');

// Start our tests
// DEV: These tests verify our database requires candidate ids align between application/application reminder
scenario.model('An ApplicationReminder model with a different candidate id from its Application model', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
}, function () {
  it('cannot be saved due to rejection at the database level', function (done) {
    // DEV: We enforce this at the database level to prevent accidental bugs
    var reminder = this.models[dbFixtures.REMINDER_WAITING_FOR_RESPONSE_KEY];
    reminder.setDataValue('candidate_id', 'alt00000-0000-0000-0000-000000000000');
    reminder.save({validate: false, _allowNoTransaction: true, _sourceType: 'server'}).asCallback(
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
scenario.model('An ApplicationReminder model being deleted', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
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
  before(function verifyApplicationRemindersExist (done) {
    ApplicationReminder.findAll().asCallback(function verifyApplicationRemindersExistFn (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      done();
    });
  });

  it('prevents application reminder deletion', function (done) {
    var reminder = ApplicationReminder.build({id: 'abcdef-intertrode-reminder-uuid'});
    reminder.destroy({_sourceType: 'server'}).asCallback(function handleDestroy (err) {
      expect(err).to.not.equal(null);
      expect(err.message).to.contain('delete on table "application_reminders" violates foreign key constraint ' +
        '"applications_saved_for_later_reminder_id_fkey"');
      done();
    });
  });
});
