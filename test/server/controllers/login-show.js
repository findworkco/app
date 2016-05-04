// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to /login', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/login'));

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  it('recieves the login page', function () {
    expect(this.$('.content__heading').text()).to.equal('Sign up/Log in');
  });

  it('has a button to log in with Google', function () {
    expect(this.$('#login_with_google').text()).to.equal('G+ Sign up/Log in with Google');
  });
});