// Load in our dependencies
var expect = require('chai').expect;
var Application = require('../../../server/models/application');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario.route('A request to a POST /application/:id/restore', function () {
  var archivedDbFixture = dbFixtures.APPLICATION_ARCHIVED;
  var archivedRestoreUrl = 'application/abcdef-monstromart-uuid/restore';

  scenario.routeTest('from an archived application', {
    dbFixtures: [archivedDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToRestore');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-monstromart-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(archivedRestoreUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302); // Temporary redirect
      expect(this.lastRedirect.redirectUri).to.match(/\/application\/abcdef-monstromart-uuid$/);
    });

    it('has a flash message about restoring application', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application restored');
    });

    it('runs `Application.updateToRestore()`', function () {
      // DEV: This verifies non-archived applications are rejected via model tests
      var updateToRestoreSpy = Application.Instance.prototype.updateToRestore;
      expect(updateToRestoreSpy.callCount).to.equal(1);
    });

    it('restores original application status and removes archived at date in database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        expect(applications[0].get('archived_at_moment')).to.equal(null);
        done();
      });
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [archivedDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(archivedRestoreUrl),
        csrfForm: true, followRedirect: false,
        expectedStatusCode: 404
      });

    it('receives a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('for a non-existent application', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/restore'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

    it('receives a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/restore'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
