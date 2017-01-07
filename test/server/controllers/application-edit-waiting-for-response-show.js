// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (waiting for response)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('sets status to "Waiting for response"', function () {
      // Assert application status
    });

    it.skip('has an action to mark application with "Recieved offer"', function () {
      // Assert form exists
    });

    it.skip('has an action to archive application', function () {
      // Assert form exists
    });

    it.skip('shows application date', function () {
      // Assert application date
      expect(true).to.equal(false);
    });

    it.skip('has a past interviews section', function () {
      // Assert past interviews section
    });
  });
});
