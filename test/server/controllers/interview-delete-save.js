// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');
var Application = require('../../../server/models/application');
var Interview = require('../../../server/models/interview');

// Start our tests
scenario.route('A request to POST /interview/:id/delete', function () {
  var upcomingInterviewDbFixture = dbFixtures.APPLICATION_UPCOMING_INTERVIEW;
  var upcomingInterviewInterviewDeleteUrl = '/interview/abcdef-umbrella-corp-interview-uuid/delete';
  scenario.routeTest('from the owner user', {
    dbFixtures: [upcomingInterviewDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToInterviewChanges');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/interview/abcdef-umbrella-corp-interview-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(upcomingInterviewInterviewDeleteUrl),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to the application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/application\/[^\/]+$/);
    });

    it('notifies user of deletion success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Interview deleted');
    });

    // DEV: Cascade deletion for reminders is tested by model tests
    it('deletes our interview from the database', function (done) {
      Interview.findAll().asCallback(function handleFindAll (err, interviews) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(interviews).to.have.length(0);
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
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        done();
      });
    });

    // DEV: We could assert waiting for response reminder fallback but this is tested by `updateToInterviewChanges()`
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [upcomingInterviewDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(upcomingInterviewInterviewDeleteUrl),
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
      method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist/delete'),
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
      method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist/delete'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
