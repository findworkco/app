// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var Application = require('../../server/models/application');
var ApplicationReminder = require('../../server/models/application-reminder');
var dbFixtures = require('./utils/db-fixtures');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// This is a redundant edge case tester as there's no good place otherwise

// Start our tests
scenario('An application that hasn\'t been touched in a while with an waiting for response reminder ' +
    'when we accidentally run "received offer" and run "remove offer"', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_NOT_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  // Log in and make our requests
  before(function overrideUpdatedAt (done) {
    // Manually override `updated_at` as it can't be done with fixtures nor Sequelize's API (tried `silent` but nope)
    ApplicationReminder.sequelize.query(
      'UPDATE application_reminders SET updated_at=\'2016-03-03T15:00:00.000Z\';').asCallback(done);
  });
  before(function sanityCheckFixtures (done) {
    ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('updated_at')).to.be.a('date');
      expect(reminders[0].get('updated_at')).to.be.lessThan(moment().subtract({minutes: 10}));
      expect(reminders[0].get('date_time_moment').toISOString()).to.equal('2022-12-01T15:00:00.000Z');
      done();
    });
  });
  httpUtils.session.init().login()
    .save(serverUtils.getUrl('/application/abcdef-sky-networks-uuid'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid/received-offer'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    })
    .save(serverUtils.getUrl('/application/abcdef-sky-networks-uuid'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid/remove-offer'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  it('uses original reminder', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('waiting_for_response_reminder_id')).to.equal('abcdef-sky-networks-reminder-uuid');
      done();
    });
  });

  it('uses original reminder configuration', function (done) {
    ApplicationReminder.findAll({
      where: {type: 'waiting_for_response'}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('date_time_moment').toISOString()).to.equal('2022-12-01T15:00:00.000Z');
      done();
    });
  });
});

scenario('An application with a long inactive received offer reminder ' +
    'being moved back to received offer', {
  dbFixtures: [
    dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_WITH_RECEIVED_OFFER_REMINDER_NOT_DUE,
    dbFixtures.DEFAULT_FIXTURES
  ]
}, function () {
  // Log in and make our requests
  before(function overrideUpdatedAt (done) {
    // Manually override `updated_at` as it can't be done with fixtures nor Sequelize's API (tried `silent` but nope)
    ApplicationReminder.sequelize.query(
      'UPDATE application_reminders SET updated_at=\'2016-03-03T15:00:00.000Z\' ' +
      'WHERE id=\'abcdef-black-mesa-reminder-uuid\';').asCallback(done);
  });
  before(function sanityCheckFixtures (done) {
    ApplicationReminder.findAll({
      where: {type: 'received_offer'}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('updated_at')).to.be.a('date');
      expect(reminders[0].get('updated_at')).to.be.lessThan(moment().subtract({minutes: 10}));
      expect(reminders[0].get('date_time_moment').toISOString()).to.equal('2022-12-09T09:00:00.000Z');
      done();
    });
  });
  httpUtils.session.init().login()
    .save(serverUtils.getUrl('/application/abcdef-sky-networks-uuid'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid/received-offer'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  it('updates existing received offer reminder', function (done) {
    Application.findAll().asCallback(function handleFindAll (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      expect(applications[0].get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');
      done();
    });
  });

  it('updates reminder configuration', function (done) {
    ApplicationReminder.findAll({
      where: {type: 'received_offer'}
    }).asCallback(function handleFindAll (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(1);
      expect(reminders[0].get('date_time_moment').toISOString()).to.not.equal('2022-12-09T09:00:00.000Z');
      expect(reminders[0].get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
      expect(reminders[0].get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
      done();
    });
  });
});
