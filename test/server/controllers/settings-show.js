// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to GET /settings from a logged in user', function () {
  // Log in our user (need to add) and make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/settings'), expectedStatusCode: 200});

  it('recieves the settings page', function () {
    expect(this.$('.content__heading').text()).to.equal('Settings');
  });
});

scenario.skip('A request to GET /settings from a logged out user', function () {
  // Make our request
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/settings'),
    followRedirect: false,
    expectedStatusCode: 302
  });

  it('is redirected to the /login page', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
