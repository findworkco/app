// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to POST /application/:id (generic)', function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    // TODO: Complete form for test
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/' + applicationId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to the application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/application\/abcdef-sky-networks-uuid$/);
    });

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Changes saved');
    });

    it.skip('updates our application in the database', function () {
      // Verify data in PostgreSQL
    });
  });

  scenario.nonOwner.skip('from a non-owner user', function () {
    // Log in (need to do) and make our request
    var applicationId = 'abcdef-uuid';
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
