// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET / from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/'), expectedStatusCode: 200});

  it('recieves the landing page', function () {
    expect(this.$('title').text()).to.equal('Find Work - Manage job leads and applications');
    expect(this.body).to.contain('Annotated application screenshot');
  });
});

describe.skip('A request to / from a logged in user', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/'),
    followRedirect: false,
    expectedStatusCode: 302
  });

  it('is redirected to the /schedule page', function () {
    expect(this.res.headers).to.have.property('Location', '/schedule');
  });
});
