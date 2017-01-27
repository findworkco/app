// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /terms', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/terms'), expectedStatusCode: 200});

    it('recieves the terms page', function () {
      expect(this.$('title').text()).to.equal('Terms of service - Find Work');
      expect(this.body).to.contain('Add Terms of service');
    });
  });
});
