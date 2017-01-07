// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to POST /application/:id/add-interview', function () {
  scenario.routeTest('from the owner user', {
    // TODO: Verify application gets new status on save (and isn't an upcoming interview to start)
    dbFixtures: [dbFixtures.APPLICATION_SKY_NETWORKS, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
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

    it.skip('redirects to the application page', function () {
      expect(this.res.headers).to.have.property('location', '/application/' + applicationId);
    });

    it.skip('creates our interview in the database', function () {
      // Verify data in PostgreSQL
    });

    describe('on redirect completion', function () {
      httpUtils.session.save(serverUtils.getUrl('/schedule'));

      it('notifies user of creation success', function () {
        expect(this.$('#notification-content > [data-notification=success]').text())
          .to.equal('Interview saved');
      });
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

  scenario.nonOwner.skip('from a non-owner user', function () {
    // Log in (need to do) and make our request
    var applicationId = 'abcdef-uuid';
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/add-interview'),
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
