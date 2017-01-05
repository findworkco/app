// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Application = require('../../../server/models/application');
var Candidate = require('../../../server/models/candidate');
var Interview = require('../../../server/models/interview');
var Reminder = require('../../../server/models/reminder');

// Define common application setups
var validBaseApplication = {
  application_date: '2017-01-31',
  candidate_id: 'mock-candidate-id',
  name: 'mock name',
  notes: 'mock notes'
};
var validSavedForLaterApplication = _.defaults({
  application_date: null,
  status: 'saved_for_later',
  saved_for_later_reminder_id: 'mock-reminder-id'
}, validBaseApplication);

// Start our tests
scenario.model('A valid Application model', function () {
  it('receives no validation errors', function (done) {
    var application = Application.build(_.clone(validSavedForLaterApplication));
    application.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An Application model with an empty name', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validSavedForLaterApplication, {
      name: ''
    }));
    application.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'name');
      expect(validationErr.errors[0]).to.have.property('message', 'Name cannot be empty');
      done();
    });
  });
});

scenario.model('An Application model with an invalid status', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'invalid_status'
    }));
    application.validate({skip: ['statusHasMatchingApplicationDate', 'statusHasMatchingReminder']})
        .asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'status');
      expect(validationErr.errors[0]).to.have.property('message', 'Invalid status provided');
      done();
    });
  });
});

// Reminder tests
var reminderTestSkips = {skip: ['statusHasMatchingApplicationDate', 'statusHasMatchingArchivedDate']};
scenario.model('A saved for later Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'saved_for_later'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[0].message).to.match(/"saved_for_later" application.+reminder set/);
      done();
    });
  });
});

scenario.model('A waiting for response Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'waiting_for_response'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[0].message).to.match(/"waiting_for_response" application.+reminder set/);
      done();
    });
  });
});

scenario.model('An upcoming interview Application model with no reminder', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'upcoming_interview'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A received offer Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'received_offer'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[0].message).to.match(/"received_offer" application.+reminder set/);
      done();
    });
  });
});

scenario.model('An archived Application model with no reminder', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'archived'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

// Application date tests
var applicationDateSkips = {skip: ['statusHasMatchingReminder']};
scenario.model('A saved for later Application model with no application date', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'saved_for_later'
    }));
    application.validate(applicationDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A non-saved for later Application model with no application date', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'waiting_for_response'
    }));
    application.validate(applicationDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingApplicationDate');
      expect(validationErr.errors[0].message).to.contain(
        'Expected non-"saved_for_later" application to have an application date set');
      done();
    });
  });
});

// Archived date tests
var archivedDateSkips = {skip: ['statusHasMatchingReminder', 'statusHasMatchingApplicationDate']};
scenario.model('A non-archived Application model with no archived date', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'waiting_for_response'
    }));
    application.validate(archivedDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An archived Application model with no archived date', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'archived'
    }));
    application.validate(archivedDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingArchivedDate');
      expect(validationErr.errors[0].message).to.contain(
        'Expected archived application to have an archived at date set');
      done();
    });
  });
});

// DEV: This test verifies our database has proper cascading deletion hooks
scenario.model('An Application model being deleted which has interviews and reminders', {
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
  before(function deleteApplication (done) {
    var application = Application.build({id: 'abcdef-sky-networks-uuid'});
    application.destroy({_sourceType: 'server', _allowNoTransaction: true}).asCallback(done);
  });

  it('doesn\'t delete candidate', function (done) {
    Candidate.findAll().asCallback(function verifyCandidateExistsFn (err, candidates) {
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
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
