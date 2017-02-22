// Load in our dependencies
var expect = require('chai').expect;
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');

// Start our tests
scenario.route('A request to a POST /application/:id/remove-offer', function () {
  var receivedOfferDbFixture = dbFixtures.APPLICATION_RECEIVED_OFFER;
  var receivedOfferRemoveOfferUrl = 'application/abcdef-black-mesa-uuid/remove-offer';
  scenario.routeTest('from a received offer application with no upcoming interviews', {
    dbFixtures: [receivedOfferDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToRemoveOffer');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-black-mesa-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(receivedOfferRemoveOfferUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302); // Temporary redirect
      expect(this.lastRedirect.redirectUri).to.match(/\/application\/abcdef-black-mesa-uuid$/);
    });

    it('has update flash message', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Removed offer from application');
    });

    it('runs `Application.updateToRemoveOffer()`', function () {
      // DEV: This verifies non-saved for later applications are rejected via model tests
      var updateToReceivedOfferSpy = Application.Instance.prototype.updateToRemoveOffer;
      expect(updateToReceivedOfferSpy.callCount).to.equal(1);
    });

    it('updates application status and keeps old reminder reference',
        function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        expect(applications[0].get('received_offer_reminder_id')).to.be.a('string');
        done();
      });
    });

    it('doesn\'t delete the received offer reminder', function (done) {
      ApplicationReminder.findAll({where: {type: 'received_offer'}}).asCallback(
          function handleFindAll (err, reminders) {
        if (err) { return done(err); }
        expect(reminders).to.have.length(1);
        done();
      });
    });
  });

  scenario.routeTest('from a received offer application with upcoming interviews', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER_WITH_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-black-mesa-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(receivedOfferRemoveOfferUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('updates application status and keeps old reminder reference',
        function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('upcoming_interview');
        expect(applications[0].get('waiting_for_response_reminder_id')).to.equal(null);
        done();
      });
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [receivedOfferDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(receivedOfferRemoveOfferUrl),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/remove-offer'),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/remove-offer'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
