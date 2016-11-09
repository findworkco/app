// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to a received offer GET /application/:id', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-black-mesa-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('sets status to "Received offer"', function () {
    // Assert application status
  });

  it.skip('has an action to archive application', function () {
    // Assert form exists
  });

  it.skip('has an action to mark application with "Remove offer"', function () {
    // Assert form exists
  });

  it.skip('shows application date', function () {
    // Assert application date
    expect(true).to.equal(false);
  });

  it.skip('has a response reminder', function () {
    // Assert response reminder exists
  });

  it.skip('has a past interviews section', function () {
    // Assert past interviews section
  });
});
