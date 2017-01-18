// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var Promise = require('bluebird');
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario.route('A request to a POST /application/:id/received-offer', function () {
  var waitingForResponseDbFixture = dbFixtures.APPLICATION_WAITING_FOR_RESPONSE;
  var waitingForResponseReceivedOfferUrl = 'application/abcdef-sky-networks-uuid/received-offer';
  scenario.routeTest('from an active application', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToReceivedOffer');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-sky-networks-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseReceivedOfferUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302); // Temporary redirect
      expect(this.lastRedirect.redirectUri).to.match(/\/application\/abcdef-sky-networks-uuid$/);
    });

    it('has update flash message', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application updated to "Received offer"');
    });

    it('runs `Application.updateToReceivedOffer()`', function () {
      // DEV: This verifies non-saved for later applications are rejected via model tests
      var updateToReceivedOfferSpy = Application.Instance.prototype.updateToReceivedOffer;
      expect(updateToReceivedOfferSpy.callCount).to.equal(1);
    });

    it('updates application "received offer" in database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('received_offer');
        expect(applications[0].get('received_offer_reminder_id')).to.be.a('string');
        done();
      });
    });

    it('creates default received offer reminder', function (done) {
      ApplicationReminder.findAll({where: {type: 'received_offer'}}).asCallback(
          function handleFindAll (err, reminders) {
        if (err) { return done(err); }
        expect(reminders).to.have.length(1);
        expect(reminders[0].get('application_id')).to.equal('abcdef-sky-networks-uuid');
        expect(reminders[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[0].get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
        expect(reminders[0].get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
        done();
      });
    });
  });

  scenario.routeTest('from an application with a received offer reminder', {
    dbFixtures: [waitingForResponseDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    before(function updateFixture (done) {
      // Verify we don't have a reminder yet
      var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];

      // Generate a reminder for our application
      expect(application.get('received_offer_reminder_id')).to.equal(null);
      var reminder = ApplicationReminder.build({
        application_id: application.get('id'),
        candidate_id: 'default0-0000-0000-0000-000000000000',
        type: 'received_offer',
        is_enabled: true,
        date_time_moment: moment.tz('2016-03-14', 'GB-Europe/London')
      });
      application.set('received_offer_reminder_id', reminder.get('id'));

      // Save changes
      Application.sequelize.transaction(function handleTransaction (t) {
        return Promise.all([
          reminder.save({_sourceType: 'server', transaction: t}),
          application.save({_sourceType: 'server', transaction: t})
        ]);
      }).asCallback(done);
    });
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-sky-networks-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(waitingForResponseReceivedOfferUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('reuses existing received offer reminder', function (done) {
      ApplicationReminder.findAll({where: {type: 'received_offer'}}).asCallback(
          function handleFindAll (err, reminders) {
        if (err) { return done(err); }
        expect(reminders).to.have.length(1);
        expect(reminders[0].get('date_time_moment').toISOString()).to.equal('2016-03-14T00:00:00.000Z');
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
        method: 'POST', url: serverUtils.getUrl(waitingForResponseReceivedOfferUrl),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/received-offer'),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/received-offer'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
