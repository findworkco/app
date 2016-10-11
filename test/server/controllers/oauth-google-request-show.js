// Load in our dependencies
var url = require('url');
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /oauth/google/request without an action', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/oauth/google/request'),
    followRedirect: false,
    expectedStatusCode: 400
  });

  it('is rejected', function () {
    expect(this.body).to.contain('Missing query string/body parameter: &quot;action&quot;');
  });
});

describe('A request to GET /oauth/google/request with an invalid action', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/request',
      query: {action: 'invalid_action'}
    }),
    followRedirect: false,
    expectedStatusCode: 400
  });

  it('is rejected', function () {
    expect(this.body).to.contain('Invalid OAuth action provided');
  });
});

describe('A request to GET /oauth/google/request with a valid action', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/request',
      query: {action: 'login'}
    }),
    followRedirect: false,
    expectedStatusCode: 302
  });

  it('is redirected to Google\'s OAuth page', function () {
    // Verify we got a state token
    var state = url.parse(this.res.headers.location, true).query.state;
    expect(state).to.not.equal(undefined);

    // Verify rest of redirect
    var redirectUri = 'https://findwork.test/oauth/google/callback?action=login';
    expect(this.res.headers.location).to.equal(
      'http://localhost:7000/o/oauth2/v2/auth' +
        '?response_type=code&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&scope=email&state=' + encodeURIComponent(state) +
        '&client_id=' + encodeURIComponent('mock-google-client-id.apps.googleusercontent.com'));
  });
});
