// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /settings from a logged in user', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/settings'), expectedStatusCode: 200});

  it('recieves the settings page', function () {
    expect(this.$('.content__heading').text()).to.equal('Settings');
  });
});

describe.skip('A request to GET /settings from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/settings'),
    followRedirect: false,
    expectedStatusCode: 302
  });

  it('is redirected to the /login page', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
