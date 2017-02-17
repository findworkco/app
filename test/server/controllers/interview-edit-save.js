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
  date_time_timezone: 'US-America/New_York',
  details: 'Test details',

  pre_interview_reminder_enabled: 'no',
  pre_interview_reminder_date: '2022-03-05',
  pre_interview_reminder_time: '13:00',
  pre_interview_reminder_timezone: 'US-America/New_York',

  post_interview_reminder_enabled: 'no',
  post_interview_reminder_date: '2022-03-05',
  post_interview_reminder_time: '19:00',
  post_interview_reminder_timezone: 'US-America/New_York'
};
scenario.route('A request to POST /interview/:id', function () {
  var waitingForResponseDbFixture = dbFixtures.APPLICATION_WAITING_FOR_RESPONSE;
  var waitingForResponseInterviewUrl = '/interview/abcdef-sky-networks-interview-uuid';
  scenario.routeTest('updating past interview to upcoming interview from the owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(waitingForResponseInterviewUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseInterviewUrl),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: validFormData, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Changes saved');
    });

    it('redirects to the interview page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/interview\/abcdef-sky-networks-interview-uuid$/);
    });

    it('updates our interview in the database', function (done) {
      Interview.findAll().asCallback(function handleFindAll (err, interviews) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(interviews).to.have.length(1);
        expect(interviews[0].get('id')).to.be.a('string');
        expect(interviews[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(interviews[0].get('application_id')).to.equal('abcdef-sky-networks-uuid');
        expect(interviews[0].get('type')).to.equal('upcoming_interview');
        expect(interviews[0].get('can_send_reminders')).to.equal(true);
        expect(interviews[0].get('date_time_datetime').toISOString()).to.equal('2022-03-05T21:00:00.000Z');
        expect(interviews[0].get('date_time_timezone')).to.equal('US-America/New_York');
        expect(interviews[0].get('pre_interview_reminder_id')).to.be.a('string');
        expect(interviews[0].get('pre_interview_reminder_id')).to.not.equal('sky-networks-reminder-pre-int-uuid');
        expect(interviews[0].get('post_interview_reminder_id')).to.be.a('string');
        expect(interviews[0].get('post_interview_reminder_id')).to.not.equal('sky-networks-reminder-post-int-uuid');
        expect(interviews[0].get('details')).to.equal('Test details');
        done();
      });
    });

    it('creates new reminders in the database', function (done) {
      InterviewReminder.findAll({
        where: {id: {$notIn: ['sky-networks-reminder-pre-int-uuid', 'sky-networks-reminder-post-int-uuid']}}
      }).asCallback(function handleFindAll (err, reminders) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(reminders).to.have.length(2);
        reminders.sort(function sortByType (a, b) {
          // Sort in reverse order so `pre` comes before `post`
          return b.get('type').localeCompare(a.get('type'));
        });

        expect(reminders[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[0].get('interview_id')).to.equal('abcdef-sky-networks-interview-uuid');
        expect(reminders[0].get('type')).to.equal('pre_interview');
        expect(reminders[0].get('date_time_datetime').toISOString()).to.equal('2022-03-05T18:00:00.000Z');
        expect(reminders[0].get('date_time_timezone')).to.equal('US-America/New_York');
        expect(reminders[0].get('is_enabled')).to.equal(false);
        expect(reminders[0].get('sent_at_datetime')).to.equal(null);

        expect(reminders[1].get('id')).to.be.a('string');
        expect(reminders[1].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[1].get('interview_id')).to.equal('abcdef-sky-networks-interview-uuid');
        expect(reminders[1].get('type')).to.equal('post_interview');
        expect(reminders[1].get('date_time_datetime').toISOString()).to.equal('2022-03-06T00:00:00.000Z');
        expect(reminders[1].get('date_time_timezone')).to.equal('US-America/New_York');
        expect(reminders[1].get('is_enabled')).to.equal(false);
        expect(reminders[1].get('sent_at_datetime')).to.equal(null);
        done();
      });
    });

    it('calls `Application.updateToInterviewChanges`', function () {
      var updateToInterviewChangesSpy = Application.Instance.prototype.updateToInterviewChanges;
      expect(updateToInterviewChangesSpy.callCount).to.equal(1);
    });

    // Past -> upcoming interview specific
    it('updates our application status', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('upcoming_interview');
        done();
      });
    });
  });

  scenario.routeTest('updating upcoming interview to past interview from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/interview/abcdef-umbrella-corp-interview-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/interview/abcdef-umbrella-corp-interview-uuid'),
        htmlForm: _.defaults({
          date_time_date: '2017-01-12',
          pre_interview_reminder_enabled: 'yes',
          pre_interview_reminder_date: '2017-01-11',
          post_interview_reminder_enabled: 'yes',
          post_interview_reminder_date: '2017-01-14'
        }, validFormData), followRedirect: false,
        expectedStatusCode: 302
      });

    it('updates interview type', function (done) {
      Interview.findAll().asCallback(function handleFindAll (err, interviews) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(interviews).to.have.length(1);
        expect(interviews[0].get('type')).to.equal('past_interview');
        expect(interviews[0].get('can_send_reminders')).to.equal(false);
        done();
      });
    });

    // Upcoming -> past interview specific
    it('doesn\'t change application status', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        done();
      });
    });

    // DEV: We don't assert waiting for response reminder fallback as it's guaranteed by `_createOrRemoveDefaultContent`
  });

  scenario.routeTest('for invalid form data from the owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(waitingForResponseInterviewUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseInterviewUrl),
        htmlForm: _.defaults({
          pre_interview_reminder_enabled: 'yes',
          pre_interview_reminder_time: '19:00',
          post_interview_reminder_enabled: 'yes',
          post_interview_reminder_time: '13:00'
        }, validFormData),
        followRedirect: false,
        expectedStatusCode: 400,
        validateHtmlFormDifferent: {exclude: [
            'pre_interview_reminder_enabled', 'post_interview_reminder_enabled']}
      });

    it('outputs validation errors on page', function () {
      expect(this.$('#validation-errors').text()).to.contain('Pre-interview reminder was set after interview');
      expect(this.$('#validation-errors').text()).to.contain('Post-interview reminder was set before interview');
    });

    it('reuses submitted values in inputs/textareas', function () {
      expect(this.$('input[name=details]').val()).to.equal('Test details');
      expect(this.$('input[name=date_time_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=date_time_time]').val()).to.equal('16:00');
      expect(this.$('select[name=date_time_timezone]').val()).to.equal('US-America/New_York');

      expect(this.$('input[name=pre_interview_reminder_enabled][value=yes]').attr('checked'))
        .to.equal('checked');
      expect(this.$('input[name=pre_interview_reminder_enabled][value=no]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal('19:00');
      expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/New_York');

      expect(this.$('input[name=post_interview_reminder_enabled][value=yes]').attr('checked'))
        .to.equal('checked');
      expect(this.$('input[name=post_interview_reminder_enabled][value=no]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal('13:00');
      expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/New_York');
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseInterviewUrl),
        csrfForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist'),
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
      method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
