// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /logout', function () {
  // Start our server, login, and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/settings'))
    .save({method: 'POST', url: serverUtils.getUrl('/logout'), htmlForm: true, followRedirect: false});

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('is redirected to the landing page', function () {
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('location', '/');
  });

  it.skip('destroys the session cookie', function () {
    // Verify cookie jar exists via a `before`?
    // Verify cookie jar is empty
  });

  it.skip('destroys the stored session data', function () {
    // Reuse original cookie value, verify Redis destroyed info
  });
});
