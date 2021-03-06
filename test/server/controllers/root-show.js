// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/'), expectedStatusCode: 200});

    it('recieves the landing page', function () {
      expect(this.$('title').text()).to.equal('Find Work - Be the best candidate for the job');
      expect(this.body).to.contain('Annotated application screenshot');
    });
  });

  scenario.routeTest('from a logged in user', function () {
    // Log in our user and make our request
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl('/'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    it('is redirected to the /schedule page', function () {
      expect(this.res.headers).to.have.property('location', '/schedule');
    });
  });
});
