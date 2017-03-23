// Load in our dependencies
var assert = require('assert');
var crypto = require('crypto');
var expect = require('chai').expect;
var expressRequest = require('express/lib/request');
var Candidate = require('../../../server/models/candidate');
var queue = require('../../../server/queue');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');

// Define test helpers
var _randomBytes = crypto.randomBytes;
var VALID_TOKEN = 'DA55QZ';
function stubCryptoRandomBytes() {
  sinonUtils.stub(crypto, 'randomBytes', function (len, cb) {
    if (cb && cb.name === 'handleRandomBytes') {
      var buff = Buffer.alloc(len, 0);
      buff.writeInt8(0x01, 1);
      buff.writeInt8(0x02, 2);
      cb(null, buff);
    } else {
      return _randomBytes.apply(crypto, arguments);
    }
  });
}
function loginViaEmail(scenarioInfo) {
  assert(scenarioInfo);
  stubCryptoRandomBytes();
  sinonUtils.spy(queue, 'create');
  serverUtils.stubEmails();
  httpUtils.session.save(serverUtils.getUrl(scenarioInfo.sourceUrl))
    .save({
      method: 'POST', url: serverUtils.getUrl(scenarioInfo.requestUrl),
      htmlForm: {email: 'mock-email@mock-domain.test'},
      followRedirect: false, waitForJobs: 1,
      expectedStatusCode: 302
    })
    .save({
      url: serverUtils.getUrl({
        pathname: scenarioInfo.callbackUrl,
        query: {token: VALID_TOKEN}
      }),
      followRedirect: true,
      expectedStatusCode: 200
    });
}

// Define our test scenarios
var scenarioInfoArr = [
  {
    sourceUrl: '/sign-up',
    requestUrl: '/sign-up/email/request',
    callbackUrl: '/sign-up/email/callback'
  },
  {
    sourceUrl: '/login',
    requestUrl: '/login/email/request',
    callbackUrl: '/login/email/callback'
  }
];

// Start our tests
scenarioInfoArr.forEach(function handleScenarioInfo (scenarioInfo) {
  scenario.route('A request to GET ' + scenarioInfo.callbackUrl + ' (generic)', {
    requiredTests: {nonOwner: false}
  }, function () {
    scenario.routeTest('with no initialized request', {
      dbFixtures: null,
      googleFixtures: []
    }, function () {
      // Make our request
      httpUtils.session.init().save({
        url: serverUtils.getUrl(scenarioInfo.callbackUrl),
        followRedirect: true,
        expectedStatusCode: 400
      });

      it('redirects to initial auth page', function () {
        expect(this.lastRedirect.redirectUri).to.have.match(/(\/sign-up|\/login)$/);
        expect(this.lastRedirect.redirectUri.replace('http://localhost:9001', ''))
          .to.have.equal(scenarioInfo.sourceUrl);
        expect(this.lastRedirect).to.have.property('statusCode', 302);
      });

      it('receives an error message about token expiration', function () {
        expect(this.$('.section--error').text()).to.contain(
          'Email authentication request has expired');
      });
    });

    scenario.routeTest('with no token', {
      dbFixtures: null,
      googleFixtures: []
    }, function () {
      // Make our request
      serverUtils.stubEmails();
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.sourceUrl))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.requestUrl),
          htmlForm: {email: 'mock-email@mock-domain.test'},
          followRedirect: false, waitForJobs: 1,
          expectedStatusCode: 302
        })
        .save({
          url: serverUtils.getUrl(scenarioInfo.callbackUrl),
          followRedirect: false,
          expectedStatusCode: 400
        });

      it('receives an error message about no token', function () {
        expect(this.body).to.contain('Missing query string/body parameter: &quot;token&quot;');
      });
    });

    scenario.routeTest('with an invalid token', {
      dbFixtures: null,
      googleFixtures: []
    }, function () {
      // Make our request
      serverUtils.stubEmails();
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.sourceUrl))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.requestUrl),
          htmlForm: {email: 'mock-email@mock-domain.test'},
          followRedirect: false, waitForJobs: 1,
          expectedStatusCode: 302
        })
        .save({
          url: serverUtils.getUrl({
            pathname: scenarioInfo.callbackUrl,
            query: {token: 'invalid-token'}
          }),
          followRedirect: true,
          expectedStatusCode: 400
        });

      it('redirects to auth page', function () {
        expect(this.lastRedirect.redirectUri).to.have.match(/(\/sign-up|\/login)$/);
        expect(this.lastRedirect.redirectUri.replace('http://localhost:9001', ''))
          .to.have.equal(scenarioInfo.sourceUrl);
        expect(this.lastRedirect).to.have.property('statusCode', 302);
      });

      it('displays an invalidation message', function () {
        expect(this.$('.section--error').text()).to.contain(
          'Email authentication request is either invalid or has expired');
      });
    });

    scenario.nonExistent('with a non-existent user', {
      dbFixtures: [],
      googleFixtures: [],
      serveAnalytics: true
    }, function () {
      // Mock our IP address and make our request
      // https://www.proxynova.com/proxy-server-list/country-jp/
      // https://github.com/expressjs/express/blob/4.14.1/lib/request.js#L329-L342
      stubCryptoRandomBytes();
      sinonUtils.spy(queue, 'create');
      sinonUtils.stub(expressRequest, 'ip', {
        get: function () { return '122.212.129.9'; }
      });
      serverUtils.stubEmails();
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.sourceUrl))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.requestUrl),
          htmlForm: {email: 'mock-email@mock-domain.test'},
          followRedirect: false, waitForJobs: 1,
          expectedStatusCode: 302
        })
        .save({
          url: serverUtils.getUrl({
            pathname: scenarioInfo.callbackUrl,
            query: {token: VALID_TOKEN}
          }),
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

      // DEV: While this is a generic test, both sign-up and login can have "Sign up" events
      it('tracks sign up event', function () {
        expect(this.body).to.contain(
          'ga(\'send\', \'event\', "Sign up", "email");');
      });

      it('creates a new user', function (done) {
        Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
          if (err) { return done(err); }
          expect(candidates).to.have.length(1);
          expect(candidates[0].get('id')).to.be.a('String');
          expect(candidates[0].get('email')).to.equal('mock-email@mock-domain.test');
          expect(candidates[0].get('google_id')).to.equal(null);
          expect(candidates[0].get('google_access_token')).to.equal(null);
          // DEV: Verify we use IP address for timezone for user generation
          expect(candidates[0].get('timezone')).to.equal('JP-Asia/Tokyo');
          expect(candidates[0].get('created_at')).to.be.a('Date');
          expect(candidates[0].get('updated_at')).to.be.a('Date');
          done();
        });
      });

      it('sends new user a welcome email', function () {
        // 2 queues/emails: /auth/email/request and welcome email
        var queueCreateSpy = queue.create;
        expect(queueCreateSpy.callCount).to.equal(2);
        var emailSendStub = this.emailSendStub;
        expect(emailSendStub.callCount).to.equal(2);
        expect(emailSendStub.args[1][0].data.to).to.equal('mock-email@mock-domain.test');
        expect(emailSendStub.args[1][0].data.subject).to.equal('Welcome to Find Work!');
      });
    });

    scenario.loggedOut('with an existent user with no previous page', {
      dbFixtures: [dbFixtures.CANDIDATE_DEFAULT],
      googleFixtures: [],
      serveAnalytics: true
    }, function () {
      // Make our request
      stubCryptoRandomBytes();
      sinonUtils.spy(queue, 'create');
      serverUtils.stubEmails();
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.sourceUrl))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.requestUrl),
          htmlForm: {email: 'mock-email@mock-domain.test'},
          followRedirect: false, waitForJobs: 1,
          expectedStatusCode: 302
        })
        .save({
          url: serverUtils.getUrl({
            pathname: scenarioInfo.callbackUrl,
            query: {token: VALID_TOKEN}
          }),
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

      it('tracks log in event', function () {
        expect(this.body).to.contain(
          'ga(\'send\', \'event\', "Log in", "email");');
      });

      it('doesn\'t create a new user', function (done) {
        Candidate.findAll().asCallback(function handleCandidates (err, candidates) {
          if (err) { return done(err); }
          expect(candidates).to.have.length(1);
          done();
        });
      });

      it('doesn\'t send new user a welcome email', function () {
        // 1 queues/emails: Welcome email
        var queueCreateSpy = queue.create;
        expect(queueCreateSpy.callCount).to.equal(1);
        var emailSendStub = this.emailSendStub;
        expect(emailSendStub.callCount).to.equal(1);
      });
    });

    scenario.routeTest('with a valid yet expired token', {
      dbFixtures: null,
      googleFixtures: []
    }, function () {
      // Make our request
      sinonUtils.swap(serverUtils.config.authEmail, 'timeout', -100); // -100ms
      stubCryptoRandomBytes();
      serverUtils.stubEmails();
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.sourceUrl))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.requestUrl),
          htmlForm: {email: 'mock-email@mock-domain.test'},
          followRedirect: false, waitForJobs: 1,
          expectedStatusCode: 302
        })
        .save({
          url: serverUtils.getUrl({
            pathname: scenarioInfo.callbackUrl,
            query: {token: VALID_TOKEN}
          }),
          followRedirect: true,
          expectedStatusCode: 400
        });

      it('redirects to auth page', function () {
        expect(this.lastRedirect.redirectUri.replace('http://localhost:9001', ''))
          .to.have.equal(scenarioInfo.sourceUrl);
        expect(this.lastRedirect).to.have.property('statusCode', 302);
      });

      it('displays an invalidation message', function () {
        expect(this.$('.section--error').text()).to.contain(
          'Email authentication request has expired');
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
        });
      loginViaEmail(scenarioInfo);

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
        });
      loginViaEmail(scenarioInfo);

      it('is redirected to `/schedule`', function () {
        expect(this.lastRedirect.redirectUri).to.match(/\/schedule$/);
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
      loginViaEmail(scenarioInfo);

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
});
