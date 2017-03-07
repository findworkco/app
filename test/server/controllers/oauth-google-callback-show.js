// Load in our dependencies
var expect = require('chai').expect;
var expressRequest = require('express/lib/request');
var app = require('../utils/server').app;
var Candidate = require('../../../server/models/candidate');
var queue = require('../../../server/queue');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');

// Define our constants
var OAUTH_GOOGLE_REQUEST_URL_OPTIONS = {
  pathname: '/oauth/google/request',
  query: {action: 'login'}
};

// Start our tests
scenario.route('A request to GET /oauth/google/callback', {
  requiredTests: {nonOwner: false}
}, function () {
  scenario.routeTest('with no information', {
    dbFixtures: null,
    googleFixtures: []
  }, function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/oauth/google/callback'),
      followRedirect: false,
      expectedStatusCode: 400
    });

    it('receives an error message about no error or code', function () {
      expect(this.body).to.contain('Missing query parameter for &quot;error&quot; and &quot;code&quot;');
    });
  });

  scenario.routeTest('with an invalid OAuth action', {
    dbFixtures: null,
    googleFixtures: []
  }, function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl({
        pathname: '/oauth/google/callback',
        query: {action: 'invalid_action', error: 'access_denied'}
      }),
      followRedirect: false,
      expectedStatusCode: 400
    });

    it('is redirect to the login page', function () {
      expect(this.body).to.contain('Invalid OAuth action provided');
    });
  });

  scenario.routeTest('A login-originating request to GET /oauth/google/callback with an error', {
    dbFixtures: null,
    googleFixtures: []
  }, function () {
    // Make our request
    httpUtils.session.init()
      .save({
        url: serverUtils.getUrl({
          pathname: '/oauth/google/callback',
          query: {action: 'login', error: 'access_denied'}
        }),
        followRedirect: true,
        expectedStatusCode: 400
      });

    it('is redirected to /login', function () {
      expect(this.$('title').text()).to.equal('Log in - Find Work');
    });

    it('has a message about our error', function () {
      expect(this.body).to.contain('Access was denied from Google. Please try again.');
    });
  });

  scenario.routeTest('A sign up-originating request to GET /oauth/google/callback with an error', {
    dbFixtures: null,
    googleFixtures: []
  }, function () {
    // Make our request
    httpUtils.session.init().save({
        url: serverUtils.getUrl({
          pathname: '/oauth/google/callback',
          query: {action: 'sign_up', error: 'access_denied'}
        }),
        followRedirect: true,
        expectedStatusCode: 400
      });

    it('is redirected to /sign-up', function () {
      expect(this.$('title').text()).to.equal('Sign up - Find Work');
    });

    it('has a message about our error', function () {
      expect(this.body).to.contain('Access was denied from Google. Please try again.');
    });
  });

  scenario.routeTest('with no state', {
    dbFixtures: null,
    googleFixtures: []
  }, function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl({
        pathname: '/oauth/google/callback',
        query: {action: 'login', code: 'invalid_code'}
      }),
      followRedirect: true,
      expectedStatusCode: 403
    });

    // DEV: We could provide something helpful but passport seems against it
    it('has an error message', function () {
      expect(this.body).to.contain('Forbidden');
    });
  });

  scenario.routeTest('with an invalid state', {
    dbFixtures: null,
    googleFixtures: []
  }, function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl({
        pathname: '/oauth/google/callback',
        query: {action: 'login', code: 'invalid_code', state: 'invalid_state'}
      }),
      followRedirect: true,
      expectedStatusCode: 403
    });

    // DEV: We could provide something helpful but passport seems against it
    it('has an error message', function () {
      expect(this.body).to.contain('Forbidden');
    });
  });

  scenario.routeTest('with an invalid code', {
    dbFixtures: null,
    googleFixtures: ['/o/oauth2/v2/auth#valid', '/oauth2/v4/token#invalid-code']
  }, function () {
    // Make our request
    httpUtils.session.init().save({
      // Redirects to fake Google OAuth, then to `/oauth/google/callback`
      // DEV: While `auth#valid` sends back a code, we assume it invalid via fixture
      url: serverUtils.getUrl(OAUTH_GOOGLE_REQUEST_URL_OPTIONS),
      followRedirect: true,
      expectedStatusCode: 500
    });

    // DEV: We could provide something helpful but passport seems against it
    it('has an error message', function () {
      expect(this.body).to.contain('Internal Server Error');
    });
  });

  scenario.routeTest('with no account email address', {
    dbFixtures: null,
    googleFixtures: ['/o/oauth2/v2/auth#valid', '/oauth2/v4/token#valid-code', '/plus/v1/people/me#no-account-email']
  }, function () {
    // Make our request
    sinonUtils.spy(app.sentryClient, 'captureError');
    sinonUtils.stub(app.winston, 'error');
    httpUtils.session.init().save({
      // Redirects to fake Google OAuth, then to `/oauth/google/callback`
      url: serverUtils.getUrl(OAUTH_GOOGLE_REQUEST_URL_OPTIONS),
      followRedirect: true,
      expectedStatusCode: 500
    });

    it('has an error message', function () {
      expect(this.body).to.contain('We encountered an unexpected error');
    });

    it('reports error to Sentry', function () {
      var captureErrorSpy = app.sentryClient.captureError;
      expect(captureErrorSpy.callCount).to.equal(1);
    });
  });

  scenario.nonExistent('with a non-existent user', {
    dbFixtures: [],
    googleFixtures: ['/o/oauth2/v2/auth#valid', '/oauth2/v4/token#valid-code', '/plus/v1/people/me#valid-access-token']
  }, function () {
    // Mock our IP address and make our request
    // https://www.proxynova.com/proxy-server-list/country-jp/
    // https://github.com/expressjs/express/blob/4.14.1/lib/request.js#L329-L342
    sinonUtils.spy(queue, 'create');
    sinonUtils.stub(expressRequest, 'ip', {
      get: function () { return '122.212.129.9'; }
    });
    serverUtils.stubEmails();
    httpUtils.session.init().save({
      // Redirects to fake Google OAuth, then to `/oauth/google/callback`
      url: serverUtils.getUrl(OAUTH_GOOGLE_REQUEST_URL_OPTIONS),
      followRedirect: true, waitForJobs: 1,
      expectedStatusCode: 200
    });

    it('is redirected to /schedule', function () {
      expect(this.lastRedirect.redirectUri).to.match(/\/schedule$/);
    });

    it('welcomes user', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Welcome to Find Work!');
    });

    it('creates a new user', function (done) {
      Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
        if (err) { return done(err); }
        expect(candidates).to.have.length(1);
        expect(candidates[0].get('id')).to.be.a('String');
        expect(candidates[0].get('email')).to.equal('mock-email@mock-domain.test');
        expect(candidates[0].get('google_id')).to.equal('1234567890');
        expect(candidates[0].get('google_access_token')).to.equal('mock_access_token|default__candidate');
        // DEV: Verify we use IP address for timezone for user generation
        expect(candidates[0].get('timezone')).to.equal('JP-Asia/Tokyo');
        expect(candidates[0].get('created_at')).to.be.a('Date');
        expect(candidates[0].get('updated_at')).to.be.a('Date');
        done();
      });
    });

    it('sends new user a welcome email', function () {
      var queueCreateSpy = queue.create;
      expect(queueCreateSpy.callCount).to.equal(1);
      var emailSendStub = this.emailSendStub;
      expect(emailSendStub.callCount).to.equal(1);
      expect(emailSendStub.args[0][0].data.to).to.equal('mock-email@mock-domain.test');
      expect(emailSendStub.args[0][0].data.subject).to.equal('Welcome to Find Work!');
    });
  });

  scenario.loggedOut('with an existent user with no previous page', {
    dbFixtures: [dbFixtures.CANDIDATE_DEFAULT],
    googleFixtures: ['/o/oauth2/v2/auth#valid', '/oauth2/v4/token#valid-code', '/plus/v1/people/me#valid-access-token']
  }, function () {
    // Verify we have a different access token
    before(function assertAccessToken (done) {
      Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
        if (err) { return done(err); }
        expect(candidates).to.have.length(1);
        expect(candidates[0].get('google_access_token')).to.equal('mock_access_token_fixtured');
        done();
      });
    });

    // Make our request
    sinonUtils.spy(queue, 'create');
    serverUtils.stubEmails();
    httpUtils.session.init().save({
      // Redirects to fake Google OAuth, then to `/oauth/google/callback`
      url: serverUtils.getUrl(OAUTH_GOOGLE_REQUEST_URL_OPTIONS),
      followRedirect: true,
      expectedStatusCode: 200
    });

    it('is redirected to /schedule', function () {
      expect(this.lastRedirect.redirectUri).to.match(/\/schedule$/);
    });

    it('welcomes user back', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Welcome back to Find Work!');
    });

    it('doesn\'t create a new user', function (done) {
      Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
        if (err) { return done(err); }
        expect(candidates).to.have.length(1);
        done();
      });
    });

    it('updates Google access token', function (done) {
      Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
        if (err) { return done(err); }
        expect(candidates).to.have.length(1);
        expect(candidates[0].get('google_access_token')).to.equal('mock_access_token|default__candidate');
        done();
      });
    });

    it('doesn\'t send new user a welcome email', function () {
      var queueCreateSpy = queue.create;
      expect(queueCreateSpy.callCount).to.equal(0);
      var emailSendStub = this.emailSendStub;
      expect(emailSendStub.callCount).to.equal(0);
    });
  });

  scenario.routeTest('with an existent user with a previous GET page', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Make our rejected request and make our login request
    httpUtils.session.init()
      .save({
        url: serverUtils.getUrl('/settings'),
        followRedirect: false,
        expectedStatusCode: 302
      })
      .login();

    it('is redirected to our original page', function () {
      expect(this.lastRedirect.redirectUri).to.match(/\/settings$/);
    });
  });

  scenario.routeTest('with an existent user with a previous POST page', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Make our rejected request and make our login request
    httpUtils.session.init()
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
        csrfForm: true, followRedirect: false,
        expectedStatusCode: 302
      })
      .login();

    it('is redirected to `/schedule`', function () {
      expect(this.lastRedirect.redirectUri).to.match(/\/schedule$/);
    });
  });

  scenario.routeTest('with an existent user with no Google token', {
    dbFixtures: [dbFixtures.CANDIDATE_EMAIL],
    googleFixtures: ['/o/oauth2/v2/auth#valid', '/oauth2/v4/token#valid-code', '/plus/v1/people/me#valid-access-token']
  }, function () {
    // Verify we have no Google info
    before(function assertGoogleInfo (done) {
      Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
        if (err) { return done(err); }
        expect(candidates).to.have.length(1);
        expect(candidates[0].get('google_id')).to.equal(null);
        expect(candidates[0].get('google_access_token')).to.equal(null);
        done();
      });
    });

    // Make our request
    httpUtils.session.init().save({
      // Redirects to fake Google OAuth, then to `/oauth/google/callback`
      url: serverUtils.getUrl(OAUTH_GOOGLE_REQUEST_URL_OPTIONS),
      followRedirect: true,
      expectedStatusCode: 200
    });

    it('fills in Google id and access token', function (done) {
      Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
        if (err) { return done(err); }
        expect(candidates).to.have.length(1);
        expect(candidates[0].get('google_id')).to.equal('1234567890');
        expect(candidates[0].get('google_access_token')).to.equal('mock_access_token|default__candidate');
        done();
      });
    });
  });

  // Edge case: Session fixation prevention
  scenario.routeTest('with respect to session fixation', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Access a page, save our cookie, and login
    httpUtils.session.init().save(serverUtils.getUrl('/schedule'));
    before(function saveSessionCookie () {
      // toJSON() = {version: 'tough-cookie@2.2.2', storeType: 'MemoryCookieStore', rejectPublicSuffixes: true,
      // cookies: [{key: 'sid', value: 's%3A...', ...}]}
      var cookies = this.jar._jar.toJSON().cookies;
      expect(cookies).to.have.length(1);
      expect(cookies[0]).to.have.property('key', 'sid');
      this.sessionCookieValue = cookies[0].value;
    });
    after(function cleanup () {
      delete this.sessionCookieValue;
    });
    httpUtils.session.login();

    it('receives a new cookie after login', function () {
      var cookies = this.jar._jar.toJSON().cookies;
      expect(cookies).to.have.length(1);
      expect(cookies[0]).to.have.property('key', 'sid');
      expect(cookies[0].value).to.not.equal(this.sessionCookieValue);
    });

    describe('reusing old cookie', function () {
      before(function requestSettingsViaCookie (done) {
        httpUtils._save({
          headers: {
            cookie: 'sid=' + this.sessionCookieValue
          },
          url: serverUtils.getUrl('/schedule'),
          followRedirect: false,
          expectedStatusCode: 200
        }).call(this, done);
      });

      it('doesn\'t recognize user', function () {
        expect(this.body).to.not.contain('mock-email@mock-domain.test');
      });
    });
  });
});
