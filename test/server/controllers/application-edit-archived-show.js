// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (archived)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', function () {
    // Log in (need to do) and make our request
    var applicationId = 'abcdef-monstromart-uuid';
    httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('sets status to "Archived"', function () {
      // Assert application status
    });

    it.skip('has action to restore application', function () {
      // Assert form exists
    });

    it('shows archive date', function () {
      expect(this.$('.archive-date').text()).to.contain('Mon Jan 18 at 3:00PM CST');
    });
  });
});
