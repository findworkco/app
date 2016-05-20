// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /delete-account from a logged in user', function () {
  // Start our server, login, and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/login'))
    .save({method: 'POST', url: serverUtils.getUrl('/delete-account'), followRedirect: false});

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

  it.skip('deletes the account', function () {
    // Verify user doesn't exist in our database
  });
});

describe.skip('A request to POST /delete-account from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({method: 'POST', url: serverUtils.getUrl('/delete-account'), followRedirect: false});

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('is redirected to the login page', function () {
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('location', '/login');
  });
});
