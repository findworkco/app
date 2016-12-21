// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var Reminder = require('../../../server/models/reminder.js');

// Start our tests
var validReminder = {
  parent_id: 'mock-parent-id',
  parent_type: Reminder.PARENT_TYPES.APPLICATION,
  type: Reminder.TYPES.SAVED_FOR_LATER,
  is_enabled: true,
  date_time_moment: moment().tz('America/Chicago')
};
scenario.model('A valid reminder', function () {
  it('receives no validation errors', function (done) {
    var reminder = Reminder.build(_.clone(validReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A reminder with an invalid parent type', function () {
  it('receives validation errors', function (done) {
    var reminder = Reminder.build(_.defaults({
      parent_type: 'invalid-parent-type'
    }, validReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors.length).to.be.at.least(1);
      expect(validationErr.errors[1]).to.have.property('path', 'parent_type');
      expect(validationErr.errors[1]).to.have.property('message', 'Parent type must be application or interview');
      done();
    });
  });
});

scenario.model('A reminder with an invalid type', function () {
  it('receives validation errors', function (done) {
    var reminder = Reminder.build(_.defaults({
      type: 'invalid-type'
    }, validReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors.length).to.be.at.least(1);
      expect(validationErr.errors[1]).to.have.property('path', 'type');
      expect(validationErr.errors[1]).to.have.property('message', 'Invalid type provided');
      done();
    });
  });
});

scenario.model('A reminder with a mismatched type and parent type', function () {
  it('receives validation errors', function (done) {
    var reminder = Reminder.build(_.defaults({
      parent_type: Reminder.PARENT_TYPES.APPLICATION,
      type: Reminder.TYPES.PRE_INTERVIEW
    }, validReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors.length).to.be.at.least(1);
      expect(validationErr.errors[0]).to.have.property('path', 'typeMatchesParentType');
      expect(validationErr.errors[0].message).to.contain('`type` is not valid for `parent_type`');
      done();
    });
  });
});
