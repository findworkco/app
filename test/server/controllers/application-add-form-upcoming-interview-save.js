// Load in our dependencies
var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var Application = require('../../../server/models/application');
var Interview = require('../../../server/models/interview');
var InterviewReminder = require('../../../server/models/interview-reminder');
var AuditLog = require('../../../server/models/audit-log');

// Start our tests
var validFormData = exports.validFormData = {
  name: 'Test Corporation',
  posting_url: 'http://google.com/',
  company_name: 'Test Corporation search',
  notes: 'Test notes',
  application_date: '2017-01-31',

  date_time_date: '2022-03-05',
  date_time_time: '16:00',
  date_time_timezone: 'US-America/Chicago',
  details: 'Test details',

  pre_interview_reminder_enabled: 'yes',
  pre_interview_reminder_date: '2022-03-05',
  pre_interview_reminder_time: '13:00',
  pre_interview_reminder_timezone: 'US-America/Chicago',

  post_interview_reminder_enabled: 'yes',
  post_interview_reminder_date: '2022-03-05',
  post_interview_reminder_time: '19:00',
  post_interview_reminder_timezone: 'US-America/Chicago'
};
scenario.route('A request to POST /add-application/upcoming-interview (specific)', {
  // DEV: Logged out is tested by generic test
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('for a logged in user and valid form data', function () {
    // Login and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/add-application/upcoming-interview'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/add-application/upcoming-interview'),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: validFormData, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
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
        expect(applications[0].get('candidate_id')).to.be.a('string');
        expect(applications[0].get('application_date_datetime').toISOString()).to.equal('2017-01-31T00:00:00.000Z');
        expect(applications[0].get('status')).to.equal('upcoming_interview');
        expect(applications[0].get('name')).to.equal('Test Corporation');
        expect(applications[0].get('posting_url')).to.equal('http://google.com/');
        expect(applications[0].get('company_name')).to.equal('Test Corporation search');
        expect(applications[0].get('notes')).to.equal('Test notes');
        done();
      });
    });

    it('creates our interview in the database', function (done) {
      Interview.findAll().asCallback(function handleFindAll (err, interviews) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(interviews).to.have.length(1);
        expect(interviews[0].get('id')).to.be.a('string');
        expect(interviews[0].get('candidate_id')).to.be.a('string');
        expect(interviews[0].get('application_id')).to.be.a('string');
        expect(interviews[0].get('pre_interview_reminder_id')).to.be.a('string');
        expect(interviews[0].get('post_interview_reminder_id')).to.be.a('string');
        expect(interviews[0].get('details')).to.equal('Test details');
        done();
      });
    });

    it('creates our reminders in the database', function (done) {
      InterviewReminder.findAll().asCallback(function handleFindAll (err, reminders) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(reminders).to.have.length(2);
        reminders.sort(function sortByType (a, b) {
          // Sort in reverse order so `pre` comes before `post`
          return b.get('type').localeCompare(a.get('type'));
        });

        expect(reminders[0].get('id')).to.be.a('string');
        expect(reminders[0].get('candidate_id')).to.be.a('string');
        expect(reminders[0].get('interview_id')).to.be.a('string');
        expect(reminders[0].get('type')).to.equal('pre_interview');
        expect(reminders[0].get('date_time_datetime').toISOString()).to.equal('2022-03-05T19:00:00.000Z');
        expect(reminders[0].get('date_time_timezone')).to.equal('US-America/Chicago');
        expect(reminders[0].get('is_enabled')).to.equal(true);
        expect(reminders[0].get('sent_at_datetime')).to.equal(null);

        expect(reminders[1].get('id')).to.be.a('string');
        expect(reminders[1].get('candidate_id')).to.be.a('string');
        expect(reminders[1].get('interview_id')).to.be.a('string');
        expect(reminders[1].get('type')).to.equal('post_interview');
        expect(reminders[1].get('date_time_datetime').toISOString()).to.equal('2022-03-06T01:00:00.000Z');
        expect(reminders[1].get('date_time_timezone')).to.equal('US-America/Chicago');
        expect(reminders[1].get('is_enabled')).to.equal(true);
        expect(reminders[1].get('sent_at_datetime')).to.equal(null);
        done();
      });
    });
  });

  scenario.routeTest('for a logged in user and invalid form data', function () {
    // Login and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/add-application/upcoming-interview'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/add-application/upcoming-interview'),
        htmlForm: _.defaults({
          name: '',
          pre_interview_reminder_time: '19:00',
          post_interview_reminder_time: '13:00'
        }, validFormData),
        followRedirect: false,
        expectedStatusCode: 400
      });

    it('outputs validation errors on page', function () {
      expect(this.$('#validation-errors').text()).to.contain('Name cannot be empty');
      expect(this.$('#validation-errors').text()).to.contain('Pre-interview reminder was set after interview');
      expect(this.$('#validation-errors').text()).to.contain('Post-interview reminder was set before interview');
    });

    it('reuses submitted values in inputs/textareas', function () {
      expect(this.$('input[name=posting_url]').val()).to.equal('http://google.com/');
      expect(this.$('input[name=company_name]').val()).to.equal('Test Corporation search');
      expect(this.$('textarea[name=notes]').val()).to.equal('Test notes');
      expect(this.$('input[name=application_date]').val()).to.equal('2017-01-31');

      expect(this.$('input[name=details]').val()).to.equal('Test details');
      expect(this.$('input[name=date_time_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=date_time_time]').val()).to.equal('16:00');
      expect(this.$('select[name=date_time_timezone]').val()).to.equal('US-America/Chicago');

      expect(this.$('input[name=pre_interview_reminder_enabled][value=yes]').attr('checked'))
        .to.equal('checked');
      expect(this.$('input[name=pre_interview_reminder_enabled][value=no]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal('19:00');
      expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');

      expect(this.$('input[name=post_interview_reminder_enabled][value=yes]').attr('checked'))
        .to.equal('checked');
      expect(this.$('input[name=post_interview_reminder_enabled][value=no]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal('13:00');
      expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
    });

    // DEV: This verifies all content is run in a transaction
    it('has no orphaned models', function (done) {
      async.map([Application, Interview, InterviewReminder, AuditLog], function findAllModel (model, cb) {
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