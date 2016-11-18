// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (upcoming interview)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', function () {
    // Log in and make our request
    var applicationId = 'abcdef-monstromart-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('sets status to "Waiting for response"', function () {
      // Assert application status
    });

    it.skip('has an action to add interview', function () {
      // Assert link exists
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

    it.skip('has a follow up reminder', function () {
      // Assert follow up reminder content
    });

    it.skip('has an upcoming interviews section', function () {
      // Assert upcoming interviews section
    });
  });
});
