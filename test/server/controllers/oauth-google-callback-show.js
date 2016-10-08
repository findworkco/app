// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /oauth/google/callback with no information', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/oauth/google/callback'),
    followRedirect: false,
    expectedStatusCode: 400
  });

  it('receives an error message about no error or code', function () {
    expect(this.body).to.contain('Missing query parameter for &quot;error&quot; and &quot;code&quot;');
  });
});

describe('A request to GET /oauth/google/callback with an invalid OAuth action', function () {
  // Start our server and make our request
  serverUtils.run();
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

describe('A login-originating request to GET /oauth/google/callback with an error', function () {
  // Start our server and make our request
  serverUtils.run();
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

describe('A sign up-originating request to GET /oauth/google/callback with an error', function () {
  // Start our server and make our request
  serverUtils.run();
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

describe.skip('A request to GET /oauth/google/callback with an invalid state', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {action: 'login', state: 'invalid_state'}
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
      query: {action: 'login', state: 'valid_state', code: 'invalid_code'}
    }),
    followRedirect: true,
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
      query: {action: 'login', state: 'valid_state', code: 'valid_code'}
    }),
    followRedirect: true,
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
      query: {action: 'login', code: 'invalid_code'}
    }),
    followRedirect: true,
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

describe.skip('A request to GET /oauth/google/callback with an existant user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/oauth/google/callback',
      query: {action: 'login', state: 'valid_state', code: 'valid_code'}
    }),
    followRedirect: true,
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
