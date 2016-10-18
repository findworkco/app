// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to POST /delete-account from a logged in user', function () {
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

  it.skip('deletes the account', function () {
    // Verify user doesn't exist in our database
  });
});

scenario('A request to POST /delete-account from a logged out user', function () {
  // Make our request
  httpUtils.session.init().save({
    method: 'POST', url: serverUtils.getUrl('/delete-account'),
    csrfForm: true, followRedirect: false,
    expectedStatusCode: 302
  });

  it('is redirected to the login page', function () {
    expect(this.res.headers).to.have.property('location', '/login');
  });
});
