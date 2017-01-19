// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var Application = require('../../../server/models/application');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario.route('A request to a POST /application/:id/archive', function () {
  var waitingForResponseDbFixture = dbFixtures.APPLICATION_WAITING_FOR_RESPONSE;
  var waitingForResponseArchiveUrl = 'application/abcdef-sky-networks-uuid/archive';
  scenario.routeTest('from an archivable application', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToArchived');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-sky-networks-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseArchiveUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to schedule page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302); // Temporary redirect
      expect(this.lastRedirect.redirectUri).to.match(/\/schedule$/);
    });

    it('has update flash message', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application archived');
    });

    it('runs `Application.updateToArchived()`', function () {
      // DEV: This verifies non-archivable applications are rejected via model tests
      var updateToArchivedSpy = Application.Instance.prototype.updateToArchived;
      expect(updateToArchivedSpy.callCount).to.equal(1);
    });

    it('updates application to "archived" in database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('archived');
        expect(applications[0].get('archived_at_moment')).to.be.at.least(moment().subtract({hours: 1}));
        expect(applications[0].get('archived_at_moment')).to.be.at.most(moment().add({hours: 1}));
        done();
      });
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseArchiveUrl),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/archive'),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/archive'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
