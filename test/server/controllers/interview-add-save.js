// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to POST /application/:id/add-interview', function () {
  var skyNetworksDbFixture = dbFixtures.APPLICATION_SKY_NETWORKS;
  var skyNetworksAddInterviewUrl = '/application/abcdef-sky-networks-uuid/add-interview';
  scenario.routeTest('from the owner user', {
    dbFixtures: [skyNetworksDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    // TODO: Complete form for test
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(skyNetworksAddInterviewUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(skyNetworksAddInterviewUrl),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to the application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/application\/[^\/]+$/);
    });

    it('notifies user of creation success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Interview saved');
    });

    // TODO: Verify application gets new status on save (and isn't an upcoming interview to start)

    it.skip('creates our interview in the database', function () {
      // Verify data in PostgreSQL
    });
  });

  scenario.routeTest.skip('for a past interview from the owner user',
      function () {
    // Log in and make our request
    // TODO: Complete form for test
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/' + applicationId + '/add-interview'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/add-interview'),
        followRedirect: false,
        expectedStatusCode: 302
      });

    it('doesn\'t change application status', function () {
      // Verify data in PostgreSQL
    });
  });

  scenario.routeTest.skip('for an upcoming interview from the owner user',
      function () {
    // Log in and make our request
    // TODO: Complete form for test
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/' + applicationId + '/add-interview'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/add-interview'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 302
      });

    it('changes application status to "Upcoming interview"', function () {
      // Verify data in PostgreSQL
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [skyNetworksDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(skyNetworksAddInterviewUrl),
        csrfForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('for an application that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
