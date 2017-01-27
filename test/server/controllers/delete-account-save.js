// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var fakeGoogleFactory = require('../utils/fake-google');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var Candidate = require('../../../server/models/candidate');

// Start our tests
scenario.route('A request to POST /delete-account', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from a logged in user', function () {
    // Login and save our session cokie
    httpUtils.session.init().login().save(serverUtils.getUrl('/settings'));
    before(function saveSessionCookie () {
      // toJSON() = {version: 'tough-cookie@2.2.2', storeType: 'MemoryCookieStore', rejectPublicSuffixes: true,
      // cookies: [{key: 'sid', value: 's%3A...', ...}]}
      var cookies = this.jar._jar.toJSON().cookies;
      expect(cookies).to.have.length(1);
      expect(cookies[0]).to.have.property('key', 'sid');
      this.sessionCookie = cookies[0];
    });
    after(function cleanup () {
      delete this.sessionCookie;
    });

    // Verify we can use our cookie outside of `httpUtils.session`
    function requestSettingsViaCookie(done) {
      httpUtils._save({
        headers: {
          cookie: 'sid=' + this.sessionCookie.value
        },
        url: serverUtils.getUrl('/settings'),
        followRedirect: false,
        expectedStatusCode: null
      }).call(this, done);
    }
    before(requestSettingsViaCookie);
    before(function verifyLoggedInOnlyPageSuccess () {
      expect(this.err).to.equal(null);
      expect(this.res.statusCode).to.equal(200);
    });

    // Make our destroy account request
    httpUtils.session.save({
      method: 'POST', url: serverUtils.getUrl('/delete-account'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('is redirected to the landing page', function () {
      expect(this.res.headers).to.have.property('location', '/');
    });

    describe('on subsequent requests', function () {
      httpUtils.session.save(serverUtils.getUrl('/'));
      it('receives a new cookie', function () {
        // DEV: `express-session` doesn't erase original cookie, only invalidates in store
        var cookies = this.jar._jar.toJSON().cookies;
        expect(cookies).to.have.length(1);
        expect(cookies[0]).to.have.property('key', 'sid');
        expect(cookies[0].value).to.not.equal(this.sessionCookie.value);
      });
    });

    describe('with respect to stored session data', function () {
      // Request logged-in only page and verify rejection
      before(requestSettingsViaCookie);
      it('cannot access original session data', function () {
        expect(this.res.statusCode).to.equal(302);
        expect(this.res.headers).to.have.property('location', '/login');
      });
    });

    // DEV: Applications and interviews will be deleted via database cascade (tested in models)
    it('deletes the account', function (done) {
      Candidate.findAll().asCallback(function handleFindAll (err, candidates) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(candidates).to.have.length(0);
        done();
      });
    });
  });

  scenario.loggedOut('from a logged out user', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    googleFixtures: fakeGoogleFactory.DEFAULT_FIXTURES
  }, function () {
    // Make our request
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/delete-account'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('is redirected to the login page', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });

    // DEV: We automatically run "application add" on login completion for logged out users
    //   We want to guarantee the same behavior never occurs in our tests
    describe('on login completion', function () {
      httpUtils.session.login()
        .save({
          url: serverUtils.getUrl('/settings'),
          followRedirect: false,
          expectedStatusCode: 200
        });

      it('doesn\'t automatically delete the account', function (done) {
        Candidate.findAll().asCallback(function handleFindAll (err, candidates) {
          // If there was an error, callback with it
          if (err) { return done(err); }

          // Otherwise, assert our data
          expect(candidates).to.have.length(1);
          done();
        });
      });
    });
  });
});
