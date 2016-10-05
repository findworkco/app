// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /sign-up', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/sign-up'), expectedStatusCode: 200});

  it('recieves the sign up page', function () {
    expect(this.$('.content__heading').text()).to.equal('Sign up');
  });

  it('has a button to sign up with Google', function () {
    expect(this.$('#sign_up_with_google').text()).to.equal('G+ Sign up with Google');
    expect(this.$('#sign_up_with_google').attr('href')).to.equal('/oauth/google/request?action=sign_up');
  });
});