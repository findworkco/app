// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var Candidate = require('../../../server/models/candidate');
var Interview = require('../../../server/models/interview');
var Reminder = require('../../../server/models/reminder');

// Start our tests
scenario.model('A Candidate model', function () {
  it('requires `email` to be an email', function (done) {
    var candidate = Candidate.build({email: 'foo', timezone: 'US-America/Chicago'});
    candidate.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'email');
      expect(validationErr.errors[0]).to.have.property('message', 'Invalid email provided');
      done();
    });
  });
});

// DEV: This test verifies our database has proper cascading deletion hooks
scenario.model('A Candidate model being deleted which has applications, interviews, and reminders', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
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
      expect(reminders).to.have.length(3);
      done();
    });
  });
  before(function deleteCandidate (done) {
    var candidate = Candidate.build({id: 'default0-0000-0000-0000-000000000000'});
    candidate.destroy({_sourceType: 'server', _allowNoTransaction: true}).asCallback(done);
  });

  it('deletes candidate', function (done) {
    Candidate.findAll().asCallback(function verifyCandidateDeletedFn (err, candidates) {
      if (err) { return done(err); }
      expect(candidates).to.have.length(0);
      done();
    });
  });
  it('deletes applications', function (done) {
    Application.findAll().asCallback(function verifyApplicationsDeletedFn (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(0);
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

scenario.model('candidates table', function () {
  it('has expected relationships', function (done) {
    // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/model.js#L996-L1005
    Candidate.QueryInterface.showIndex('candidates').asCallback(function handleQuery (err, indexes) {
      expect(err).to.equal(null);

      var idIndex = _.findWhere(indexes, {name: 'candidates_pkey'});
      expect(idIndex.primary).to.equal(true);
      expect(idIndex.unique).to.equal(true);
      expect(_.pluck(idIndex.fields, 'attribute')).to.deep.equal(['id']);

      var emailIndex = _.findWhere(indexes, {name: 'candidates_email_key'});
      expect(emailIndex.unique).to.equal(true);
      expect(_.pluck(emailIndex.fields, 'attribute')).to.deep.equal(['email']);
      done();
    });
  });
});
