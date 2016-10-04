// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /login', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/login'), expectedStatusCode: 200});

  it('recieves the login page', function () {
    expect(this.$('.content__heading').text()).to.equal('Log in');
  });

  it('has a button to log in with Google', function () {
    expect(this.$('#login_with_google').text()).to.equal('G+ Log in with Google');
    expect(this.$('#login_with_google').attr('href')).to.equal('/oauth/google/request?action=login');
  });
});
