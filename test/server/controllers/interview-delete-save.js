// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to POST /interview/:id/delete', function () {
  scenario.routeTest('from the owner user', function () {
    // Log in and make our request
    // TODO: Complete form for test
    var interviewId = 'abcdef-sky-networks-interview-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/interview/' + interviewId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId + '/delete'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 302
      });

    it('redirects to the application page', function () {
      expect(this.res.headers.location).to.have.match(/^\/application\/[^\/]+$/);
    });

    it.skip('deletes our interview from the database', function () {
      // Verify data in PostgreSQL
    });

    describe('on redirect completion', function () {
      httpUtils.session.save(serverUtils.getUrl('/schedule'));

      it('notifies user of deletion success', function () {
        expect(this.$('#notification-content > [data-notification=success]').text())
          .to.equal('Interview deleted');
      });
    });
  });

  scenario.routeTest.skip('for an upcoming interview from the owner user', function () {
    // Log in and make our request
    // TODO: Complete form for test
    var interviewId = 'abcdef-sky-networks-interview-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/interview/' + interviewId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId + '/delete'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 302
      });

    it('changes application status to "Waiting for response"', function () {
      // Verify data in PostgreSQL
    });
  });

  scenario.nonOwner.skip('from a non-owner user', function () {
    // Log in (need to do) and make our request
    var interviewId = 'abcdef-uuid';
    httpUtils.session.init()
      .save(serverUtils.getUrl('/interview/' + interviewId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId + '/delete'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.routeTest.skip('from a user that owns the interview yet doesn\'t own the application', function () {
    // TODO: Enforce interview must have the same owner as application via DB restrictions
    // Log in (need to do) and make our request
    var interviewId = 'abcdef-uuid';
    httpUtils.session.init()
      .save(serverUtils.getUrl('/interview/' + interviewId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId + '/delete'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 500
      });

    it('recieves an error', function () {
      // DEV: This verifies we don't leak sensitive info if something goes wrong
      // TODO: Assert error somehow
    });
  });

  scenario.nonExistent('that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist/delete'),
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
      method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist/delete'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
