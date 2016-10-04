// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /oauth/google/request', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/oauth/google/request'),
    followRedirect: false
  });

  it('is redirected to Google\'s OAuth page', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers.location).to.equal(
      'https://accounts.google.com/o/oauth2/v2/auth' +
        '?response_type=code&redirect_uri=' + encodeURIComponent('https://findwork.test/oauth/google/callback') +
        '&scope=email&client_id=' + encodeURIComponent('mock-google-client-id.apps.googleusercontent.com'));
  });
});
