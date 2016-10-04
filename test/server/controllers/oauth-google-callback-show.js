// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe.skip('A request to GET /oauth/google/callback with no information', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/oauth/google/callback'),
    followRedirect: false,
    expectedStatusCode: 302
  });

  it('is redirected to Google\'s OAuth page', function () {
    expect(this.res.headers.location).to.equal(
      'https://accounts.google.com/o/oauth2/v2/auth' +
        '?response_type=code&redirect_uri=' + encodeURIComponent('https://findwork.test/oauth/google/callback') +
        '&scope=email&client_id=' + encodeURIComponent('mock-google-client-id.apps.googleusercontent.com'));
  });
});

describe.skip('A request to GET /oauth/google/callback with an error', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      // TODO: Provide proper error code
      query: {error: 'error_goes_here'}
    }),
    followRedirect: true,
    expectedStatusCode: 200
  });

  it('is redirected to /login', function () {
    expect(this.$('title').text()).to.equal('Sign up/Log in - Find Work');
  });

  it('has a flash message about our code', function () {
    expect(this.body).to.contain('error_goes_here');
  });
});

describe.skip('A request to GET /oauth/google/callback with an invalid state', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {state: 'invalid_state'}
    }),
    followRedirect: true,
    expectedStatusCode: 200
  });

  it('is redirected to /login', function () {
    expect(this.$('title').text()).to.equal('Sign up/Log in - Find Work');
  });

  it('has a flash message about an invalid state and trying again', function () {
    expect(this.body).to.contain('Something went wrong when talking to Google, please try logging in again');
  });
});

describe.skip('A request to GET /oauth/google/callback with an invalid code', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {state: 'valid_state', code: 'invalid_code'}
    }),
    expectedStatusCode: 200
  });

  it('is redirected to /login', function () {
    expect(this.$('title').text()).to.equal('Sign up/Log in - Find Work');
  });

  it('has a flash message about an invalid code and trying again', function () {
    expect(this.body).to.contain('Something went wrong when talking to Google, please try logging in again');
  });
});

describe.skip('A request to GET /oauth/google/callback with a non-whitelisted user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {state: 'valid_state', code: 'valid_code'}
    }),
    expectedStatusCode: 200
  });

  it('has a flash message about restricted access', function () {
    expect(this.body).to.contain('Sorry, Find Work is currently in closed development. ' +
      'Please contact todd@findwork.co to gain sign in access');
  });
});

// TODO: Enable after we integrate PostgreSQL
describe.skip('A request to GET /oauth/google/callback with a non-existant whitelisted user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {code: 'invalid_code'}
    }),
    expectedStatusCode: 200
  });

  it('is redirected to /schedule', function () {
    expect(this.$('title').text()).to.equal('Schedule - Find Work');
  });

  it('creates a new user', function () {
    // TODO: Query PostgreSQL
  });

  it('sends new user a welcome email', function () {
    // TODO: Query our job queue
  });
});

describe('A request to GET /oauth/google/callback with an existant user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {state: 'valid_state', code: 'valid_code'}
    }),
    expectedStatusCode: 200
  });

  it('is redirected to /schedule', function () {
    expect(this.$('title').text()).to.equal('Schedule - Find Work');
  });

  it.skip('doesn\'t create a new user', function () {
    // TODO: Query PostgreSQL
  });

  it.skip('doesn\'t send new user a welcome email', function () {
    // TODO: Query our job queue
  });
});
