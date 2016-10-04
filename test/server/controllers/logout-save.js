// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /logout', function () {
  // Start our server, login, and save our session cokie
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/settings'));
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
      expectedStatusCode: null
    }).call(this, done);
  }
  before(requestSettingsViaCookie);
  before(function verifyLoggedInOnlyPageSuccess () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  // Make our logout request
  httpUtils.session.save({
    method: 'POST', url: serverUtils.getUrl('/logout'),
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
    it.skip('cannot access original session data', function () {
      expect(this.res.statusCode).to.equal(302);
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
