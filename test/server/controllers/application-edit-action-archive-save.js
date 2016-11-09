// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.skip('A request to a POST /application/:id/archive from a saved for later application', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-intertrode-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/archive'),
      htmlForm: true, followRedirect: true,
      expectedStatusCode: 500
    });

  it.skip('receives a message about it being invalid', function () {
    // Assert error message
  });
});

scenario('A request to a POST /application/:id/archive from a non-saved for later application', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/archive'),
      // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
      //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
      htmlForm: true, followRedirect: true, followAllRedirects: true,
      expectedStatusCode: 200
    });

  it.skip('redirects to schedule page', function () {
    // Assert redirect location
  });

  it.skip('has a flash message about archiving', function () {
    expect(true).to.equal(false);
  });

  it.skip('updates application to archived in database', function () {
    // Assert updated status
  });
});

scenario.skip('A request to a POST /application/:id/archive from a non-owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/archive'),
      htmlForm: true, followRedirect: true,
      expectedStatusCode: 200
    });

  it.skip('receives a 404', function () {
    // Assert redirect location
  });
});

scenario.skip('A request to a POST /application/:id/archive for a non-existant application', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/archive'),
      htmlForm: true, followRedirect: true,
      expectedStatusCode: 200
    });

  it.skip('receives a 404', function () {
    // Assert redirect location
  });
});
