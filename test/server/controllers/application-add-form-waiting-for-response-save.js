// Load in our dependencies
var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');
var AuditLog = require('../../../server/models/audit-log');

// Start our tests
var validFormData = exports.validFormData = {
  name: 'Test Corporation',
  posting_url: 'http://google.com/',
  company_name: 'Test Corporation search',
  notes: 'Test notes',

  application_date: '2017-01-06',
  waiting_for_response_reminder_enabled: 'no',
  waiting_for_response_reminder_date: '2022-03-05',
  waiting_for_response_reminder_time: '13:00',
  waiting_for_response_reminder_timezone: 'US-America/Los_Angeles'
};
scenario.route('A request to POST /add-application/waiting-for-response (specific)', {
  // DEV: Logged out is tested by generic test
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('for a logged in user and valid form data', function () {
    // Login and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/add-application/waiting-for-response'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/add-application/waiting-for-response'),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: validFormData, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200, validateHtmlFormDifferent: {exclude: [
          // DEV: We exclude time as it changes over the course of a day
          'waiting_for_response_reminder_time']}
      });

    it('redirects to the new application\'s page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/application\/[^\/]+$/);
    });

    it('notifies user of creation success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application created');
    });

    it('creates our application in the database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(applications).to.have.length(1);
        expect(applications[0].get('id')).to.be.a('string');
        expect(applications[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(applications[0].get('waiting_for_response_reminder_id')).to.be.a('string');
        expect(applications[0].get('application_date_datetime').toISOString()).to.equal('2017-01-06T00:00:00.000Z');
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        expect(applications[0].get('name')).to.equal('Test Corporation');
        expect(applications[0].get('posting_url')).to.equal('http://google.com/');
        expect(applications[0].get('company_name')).to.equal('Test Corporation search');
        expect(applications[0].get('notes')).to.equal('Test notes');
        done();
      });
    });

    it('creates our reminder in the database', function (done) {
      ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(reminders).to.have.length(1);
        expect(reminders[0].get('id')).to.be.a('string');
        expect(reminders[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[0].get('type')).to.equal('waiting_for_response');
        expect(reminders[0].get('application_id')).to.be.a('string');
        expect(reminders[0].get('date_time_datetime').toISOString()).to.equal('2022-03-05T21:00:00.000Z');
        expect(reminders[0].get('date_time_timezone')).to.equal('US-America/Los_Angeles');
        expect(reminders[0].get('is_enabled')).to.equal(false);
        expect(reminders[0].get('sent_at_datetime')).to.equal(null);
        done();
      });
    });
  });

  scenario.routeTest('for a logged in user and invalid form data', function () {
    // Login and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/add-application/waiting-for-response'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/add-application/waiting-for-response'),
        htmlForm: _.defaults({
          name: ''
        }, validFormData),
        followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: {exclude: [
          // DEV: We exclude time as it changes over the course of a day
          'waiting_for_response_reminder_time']}
      });

    it('outputs validation errors on page', function () {
      expect(this.$('#validation-errors').text()).to.contain('Name cannot be empty');
    });

    it('reuses submitted values in inputs/textareas', function () {
      expect(this.$('input[name=posting_url]').val()).to.equal('http://google.com/');
      expect(this.$('input[name=company_name]').val()).to.equal('Test Corporation search');
      expect(this.$('input[name=application_date]').val()).to.equal('2017-01-06');
      expect(this.$('textarea[name=notes]').val()).to.equal('Test notes');
      expect(this.$('input[name=waiting_for_response_reminder_enabled][value=yes]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=waiting_for_response_reminder_enabled][value=no]').attr('checked')).to.equal('checked');
      expect(this.$('input[name=waiting_for_response_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=waiting_for_response_reminder_time]').val()).to.equal('13:00');
      expect(this.$('select[name=waiting_for_response_reminder_timezone]').val()).to.equal('US-America/Los_Angeles');
    });

    // DEV: This verifies all content is run in a transaction
    it('has no orphaned models', function (done) {
      async.map([Application, ApplicationReminder, AuditLog], function findAllModel (model, cb) {
        model.findAll().asCallback(cb);
      }, function handleResults (err, resultsArr) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Reduce our results and filter out candidate audit log
        var flatResults = _.flatten(resultsArr);
        flatResults = flatResults.filter(function isNotCandidateAuditLog (instance) {
          return instance.get('table_name') !== 'candidates';
        });
        expect(flatResults).to.have.length(0);
        done();
      });
    });
  });
});
