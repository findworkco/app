// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /privacy', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/privacy'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    it('is redirected to the privacy page', function () {
      expect(this.res.headers).to.have.property('location', 'https://www.iubenda.com/privacy-policy/8032613');
    });
  });
});
