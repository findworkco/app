// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../utils/db-fixtures');
var ApplicationReminder = require('../../../server/models/application-reminder');
var InterviewReminder = require('../../../server/models/interview-reminder');
var Reminder = require('../../../server/models/reminder');

// Start our tests
var _validReminder = {
  candidate_id: 'DEFA6170-0000-4000-8000-000000000000',
  is_enabled: true,
  date_time_moment: moment().tz('US-America/Chicago')
};
var validApplicationReminder = _.defaults({
  // https://github.com/chriso/validator.js/blob/6.2.0/src/lib/isUUID.js#L5
  // A9911CA7105 = "APPLICATION" in our attempted 1337 speak
  application_id: 'A9911CA7-1050-4000-8000-000000000000',
  type: ApplicationReminder.TYPES.SAVED_FOR_LATER
}, _validReminder);
var validInterviewReminder = _.defaults({
  // https://github.com/chriso/validator.js/blob/6.2.0/src/lib/isUUID.js#L5
  // 15735281325 = "INTERVIEW" in our attempted 1337 speak
  interview_id: '15735281-3250-4000-8000-000000000000',
  type: InterviewReminder.TYPES.PRE_INTERVIEW
}, _validReminder);
scenario.model('A valid ApplicationReminder', function () {
  it('receives no validation errors', function (done) {
    var reminder = ApplicationReminder.build(_.clone(validApplicationReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A valid InterviewReminder', function () {
  it('receives no validation errors', function (done) {
    var reminder = InterviewReminder.build(_.clone(validInterviewReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A reminder with a type', function () {
  it('receives a validation error as a base Reminder', function (done) {
    var reminder = Reminder.build(_.clone(validApplicationReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'type');
      expect(validationErr.errors[0].message).to.contain(
        '`type` requires `VALID_TYPES` to be set on child class of Reminder');
      done();
    });
  });

  // DEV: Positive working test is provided outside of this scenario
  it('receives a validation error when it\'s invalid on an ApplicationReminder', function (done) {
    var reminder = ApplicationReminder.build(_.defaults({type: 'bad-type'}, validApplicationReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'type');
      expect(validationErr.errors[0].message).to.contain('Invalid type provided');
      done();
    });
  });

  // DEV: Positive working test is provided outside of this scenario
  it('receives a validation error when it\'s invalid on an InterviewReminder', function (done) {
    var reminder = InterviewReminder.build(_.defaults({type: 'bad-type'}, validInterviewReminder));
    reminder.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'type');
      expect(validationErr.errors[0].message).to.contain('Invalid type provided');
      done();
    });
  });
});

// Add verification that we always use `ApplicationReminder` or `InterviewReminder`
scenario.model('A Reminder model', {
  dbFixtures: [dbFixtures.CANDIDATE_DEFAULT]
}, function () {
  // DEV: This test requires CASCADE changes to be in place so we can get it 100%
  it.skip('allows creation as an ApplicationReminder', function (done) {
    var reminder = ApplicationReminder.build(validApplicationReminder);
    reminder.save({_sourceType: 'server'}).asCallback(function handleCreate (err) {
      expect(err).to.equal(null);
      done();
    });
  });

  it.skip('allows creation as an InterviewReminder', function (done) {
    var reminder = InterviewReminder.build(validApplicationReminder);
    reminder.save({_sourceType: 'server'}).asCallback(function handleCreate (err) {
      expect(err).to.equal(null);
      done();
    });
  });

  it('cannot be created directly', function (done) {
    var reminder = Reminder.build(validApplicationReminder);
    reminder.save({skip: ['type'], _sourceType: 'server'}).asCallback(function handleCreate (err) {
      expect(err).to.not.equal(null);
      expect(err.message).to.contain('Direct creation of Reminder not supported');
      done();
    });
  });

  it('cannot be bulk created', function (done) {
    Reminder.bulkCreate([validApplicationReminder], {_sourceType: 'server'}).asCallback(
        function handleBulkCreate (err) {
      expect(err).to.not.equal(null);
      expect(err.message).to.contain('Bulk creation of Reminder not supported');
      done();
    });
  });

  it('cannot be deleted directly', function (done) {
    var reminder = Reminder.build({id: 'mock-id'});
    reminder.destroy({_sourceType: 'server'}).asCallback(function handleBulkCreate (err) {
      expect(err).to.not.equal(null);
      expect(err.message).to.contain('Direct deletion of Reminder not supported');
      done();
    });
  });

  it('cannot be bulk deleted', function (done) {
    Reminder.destroy({where: {id: 'mock-id'}}, {_sourceType: 'server'}).asCallback(
        function handleBulkDelete (err) {
      expect(err).to.not.equal(null);
      expect(err.message).to.contain('Bulk deletion of Reminder not supported');
      done();
    });
  });
});
