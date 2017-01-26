// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');
var Application = require('../../../server/models/application');
var Interview = require('../../../server/models/interview');
var InterviewReminder = require('../../../server/models/interview-reminder');

// Start our tests
var validFormData = {
  date_time_date: '2022-03-05',
  date_time_time: '16:00',
  date_time_timezone: 'US-America/Los_Angeles',
  details: 'Test details',

  pre_interview_reminder_enabled: 'no',
  pre_interview_reminder_date: '2022-03-05',
  pre_interview_reminder_time: '13:00',
  pre_interview_reminder_timezone: 'US-America/Los_Angeles',

  post_interview_reminder_enabled: 'no',
  post_interview_reminder_date: '2022-03-05',
  post_interview_reminder_time: '19:00',
  post_interview_reminder_timezone: 'US-America/Los_Angeles'
};
var validateFormExcludes = [
  // DEV: We exclude time as it changes over the course of a day
  'date_time_time', 'pre_interview_reminder_time', 'post_interview_reminder_time'];
scenario.route('A request to POST /application/:id/add-interview', function () {
  var waitingForResponseDbFixture = dbFixtures.APPLICATION_WAITING_FOR_RESPONSE;
  var waitingForResponseAddInterviewUrl = '/application/abcdef-sky-networks-uuid/add-interview';
  scenario.routeTest('for an upcoming interview from the owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(waitingForResponseAddInterviewUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseAddInterviewUrl),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: validFormData, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200,
        validateHtmlFormDifferent: {exclude: validateFormExcludes}
      });

    it('redirects to the application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/application\/[^\/]+$/);
    });

    it('notifies user of creation success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Interview saved');
    });

    it('creates our interview in the database', function (done) {
      Interview.findAll({where: {id: {$not: 'abcdef-sky-networks-interview-uuid'}}}).asCallback(
          function handleFindAll (err, interviews) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(interviews).to.have.length(1);
        expect(interviews[0].get('id')).to.be.a('string');
        expect(interviews[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(interviews[0].get('application_id')).to.equal('abcdef-sky-networks-uuid');
        expect(interviews[0].get('type')).to.equal('upcoming_interview');
        expect(interviews[0].get('date_time_datetime').toISOString()).to.equal('2022-03-06T00:00:00.000Z');
        expect(interviews[0].get('date_time_timezone')).to.equal('US-America/Los_Angeles');
        expect(interviews[0].get('pre_interview_reminder_id')).to.be.a('string');
        expect(interviews[0].get('post_interview_reminder_id')).to.be.a('string');
        expect(interviews[0].get('details')).to.equal('Test details');
        done();
      });
    });

    it('creates our interview reminders in the database', function (done) {
      InterviewReminder.findAll({where: {interview_id: {$not: 'abcdef-sky-networks-interview-uuid'}}}).asCallback(
          function handleFindAll (err, reminders) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(reminders).to.have.length(2);
        reminders.sort(function sortByType (a, b) {
          // Sort in reverse order so `pre` comes before `post`
          return b.get('type').localeCompare(a.get('type'));
        });

        expect(reminders[0].get('id')).to.be.a('string');
        expect(reminders[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[0].get('interview_id')).to.be.a('string');
        expect(reminders[0].get('type')).to.equal('pre_interview');
        expect(reminders[0].get('date_time_datetime').toISOString()).to.equal('2022-03-05T21:00:00.000Z');
        expect(reminders[0].get('date_time_timezone')).to.equal('US-America/Los_Angeles');
        expect(reminders[0].get('is_enabled')).to.equal(false);
        expect(reminders[0].get('sent_at_datetime')).to.equal(null);

        expect(reminders[1].get('id')).to.be.a('string');
        expect(reminders[1].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[1].get('interview_id')).to.be.a('string');
        expect(reminders[1].get('type')).to.equal('post_interview');
        expect(reminders[1].get('date_time_datetime').toISOString()).to.equal('2022-03-06T03:00:00.000Z');
        expect(reminders[1].get('date_time_timezone')).to.equal('US-America/Los_Angeles');
        expect(reminders[1].get('is_enabled')).to.equal(false);
        expect(reminders[1].get('sent_at_datetime')).to.equal(null);
        done();
      });
    });

    it('calls `Application.updateToInterviewChanges`', function () {
      var updateToInterviewChangesSpy = Application.Instance.prototype.updateToInterviewChanges;
      expect(updateToInterviewChangesSpy.callCount).to.equal(1);
    });

    // Upcoming interview specific
    it('updates our application status', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('upcoming_interview');
        done();
      });
    });
  });

  scenario.routeTest('for a past interview from the owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(waitingForResponseAddInterviewUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseAddInterviewUrl),
        htmlForm: _.defaults({
          date_time_date: '2017-01-12',
          pre_interview_reminder_date: '2017-01-11',
          post_interview_reminder_date: '2017-01-14'
        }, validFormData), followRedirect: false,
        expectedStatusCode: 302,
        validateHtmlFormDifferent: {exclude: validateFormExcludes}
      });

    it('doesn\'t change application status', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        done();
      });
    });
  });

  // DEV: We include a saved for later test to verify fallbacks are created/sved
  scenario.routeTest('for a saved for later application and past interview from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-intertrode-uuid/add-interview'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/abcdef-intertrode-uuid/add-interview'),
        htmlForm: _.defaults({
          date_time_date: '2017-01-12',
          pre_interview_reminder_date: '2017-01-11',
          post_interview_reminder_date: '2017-01-14'
        }, validFormData), followRedirect: false,
        expectedStatusCode: 302,
        validateHtmlFormDifferent: {exclude: validateFormExcludes}
      });

    it('has no errors', function () {
      // Asserted by expectedStatusCode
    });
  });

  scenario.routeTest('for invalid form data from the owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(waitingForResponseAddInterviewUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseAddInterviewUrl),
        htmlForm: _.defaults({
          pre_interview_reminder_enabled: 'yes',
          pre_interview_reminder_time: '19:00',
          post_interview_reminder_enabled: 'yes',
          post_interview_reminder_time: '13:00'
        }, validFormData),
        followRedirect: false,
        expectedStatusCode: 400,
        validateHtmlFormDifferent: {exclude: _.union([
            'pre_interview_reminder_enabled', 'post_interview_reminder_enabled'
          ], validateFormExcludes)}
      });

    it('outputs validation errors on page', function () {
      expect(this.$('#validation-errors').text()).to.contain('Pre-interview reminder was set after interview');
      expect(this.$('#validation-errors').text()).to.contain('Post-interview reminder was set before interview');
    });

    it('reuses submitted values in inputs/textareas', function () {
      expect(this.$('input[name=details]').val()).to.equal('Test details');
      expect(this.$('input[name=date_time_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=date_time_time]').val()).to.equal('16:00');
      expect(this.$('select[name=date_time_timezone]').val()).to.equal('US-America/Los_Angeles');

      expect(this.$('input[name=pre_interview_reminder_enabled][value=yes]').attr('checked'))
        .to.equal('checked');
      expect(this.$('input[name=pre_interview_reminder_enabled][value=no]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal('19:00');
      expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/Los_Angeles');

      expect(this.$('input[name=post_interview_reminder_enabled][value=yes]').attr('checked'))
        .to.equal('checked');
      expect(this.$('input[name=post_interview_reminder_enabled][value=no]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal('13:00');
      expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/Los_Angeles');
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseAddInterviewUrl),
        csrfForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('for an application that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
