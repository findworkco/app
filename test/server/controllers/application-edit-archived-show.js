// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to an archived GET /application/:id', function () {
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
