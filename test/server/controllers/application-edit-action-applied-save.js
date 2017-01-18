// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario.route('A request to a POST /application/:id/applied', function () {
  // DEV: We reuse the same fixture/URL across tests to verify they test ACL properly
  var savedForLaterAppliedUrl = '/application/abcdef-intertrode-uuid/applied';
  scenario.routeTest('from a saved for later application', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    sinonUtils.spy(Application.Instance.prototype, 'updateToApplied');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-intertrode-uuid'))
      .save({
        method: 'POST', url: serverUtils.getUrl(savedForLaterAppliedUrl),
        // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
        //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
        htmlForm: true, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('redirects to application page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302); // Temporary redirect
      expect(this.lastRedirect.redirectUri).to.match(/\/application\/[a-z\-]+$/);
    });

    it('has update flash message', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application updated to "Waiting for response"');
    });

    it('runs `Application.updateToApplied()`', function () {
      // DEV: This verifies non-saved for later applications are rejected via model tests
      var updateToAppliedSpy = Application.Instance.prototype.updateToApplied;
      expect(updateToAppliedSpy.callCount).to.equal(1);
    });

    it('updates application "waiting for response" in database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('status')).to.equal('waiting_for_response');
        expect(applications[0].get('waiting_for_response_reminder_id')).to.be.a('string');
        expect(applications[0].get('application_date_moment')).to.be.at.least(moment().subtract({hours: 1}));
        expect(applications[0].get('application_date_moment')).to.be.at.most(moment().add({hours: 1}));
        done();
      });
    });

    it('creates default waiting for response reminder', function (done) {
      ApplicationReminder.findAll({where: {type: 'waiting_for_response'}}).asCallback(
          function handleFindAll (err, reminders) {
        if (err) { return done(err); }
        expect(reminders).to.have.length(1);
        expect(reminders[0].get('application_id')).to.equal('abcdef-intertrode-uuid');
        expect(reminders[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(reminders[0].get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
        expect(reminders[0].get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
        done();
      });
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        method: 'POST', url: serverUtils.getUrl(savedForLaterAppliedUrl),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/applied'),
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
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/applied'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
