// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var Application = require('../../../server/models/application.js');

// Define common application setups
var validBaseApplication = {
  candidate_id: 'mock-candidate-id',
  name: 'mock name',
  notes: 'mock notes'
};
var validSavedForLaterApplication = _.defaults({
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
    application.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(2);
      // DEV: We test matching status/reminder separately
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[1]).to.have.property('path', 'status');
      expect(validationErr.errors[1]).to.have.property('message', 'Invalid status provided');
      done();
    });
  });
});

scenario.model('A saved for later Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'saved_for_later'
    }));
    application.validate().asCallback(function handleError (err, validationErr) {
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
    application.validate().asCallback(function handleError (err, validationErr) {
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
    application.validate().asCallback(function handleError (err, validationErr) {
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
    application.validate().asCallback(function handleError (err, validationErr) {
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
    application.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});
