// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to an waiting for response GET /application/:id', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-intertrode-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('sets status to "Saved for later"', function () {
    // Assert application status
  });

  it.skip('has expected actions', function () {
    // Assert "Applied to posting", "Add interview", and "Received offer" exist
    // Assert "Archive" doesn't exist
  });

  it.skip('has no application date', function () {
    // Assert no application date
    expect(true).to.equal(false);
  });

  it.skip('has no past interviews section', function () {
    // Assert no past interviews section
  });

  it.skip('has an application reminder', function () {
    // Assert application reminder section
  });
});
