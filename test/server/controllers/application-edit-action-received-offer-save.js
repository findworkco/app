// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to a POST /application/:id/received-offer', function () {
  scenario.routeTest('from an active application', function () {
    // Log in (need to do) and make our request
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init()
      .save(serverUtils.getUrl('/application/' + applicationId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/received-offer'),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it.skip('redirects to application page', function () {
      // Assert redirect location
    });

    it.skip('has update flash message', function () {
      expect(true).to.equal(false);
    });

    it.skip('updates application in database', function () {
      // Assert received offer status
    });
  });

  scenario.routeTest.skip('from an archived application', function () {
    // Log in (need to do) and make our request
    var applicationId = 'abcdef-monstromart-uuid';
    httpUtils.session.init()
      .save(serverUtils.getUrl('/application/' + applicationId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/received-offer'),
        htmlForm: true, followRedirect: true,
        expectedStatusCode: 500
      });

    it.skip('receives a message about it being invalid', function () {
      // Assert error message
    });
  });

  scenario.nonOwner.skip('from a non-owner user', function () {
    // Log in (need to do) and make our request
    httpUtils.session.init()
      .save(serverUtils.getUrl('/application/does-not-exist'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/received-offer'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it.skip('receives a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent.skip('for a non-existent application', function () {
    // Log in (need to do) and make our request
    httpUtils.session.init()
      .save(serverUtils.getUrl('/application/does-not-exist'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/received-offer'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it.skip('receives a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut.skip('from a logged out user', function () {
    // Make our request
    httpUtils.session.init()
      .save(serverUtils.getUrl('/application/does-not-exist'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/received-offer'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 302
      });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('Location', '/login');
    });
  });
});
