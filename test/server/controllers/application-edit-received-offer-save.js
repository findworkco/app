// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
var validFormData = exports.validFormData = {
  name: 'Test Corporation',
  posting_url: 'http://google.com/',
  company_name: 'Test Corporation search',
  notes: 'Test notes',

  application_date: '2017-01-31',
  received_offer_reminder_enabled: 'no',
  received_offer_reminder_date: '2022-03-05',
  received_offer_reminder_time: '13:00',
  received_offer_reminder_timezone: 'US-America/Los_Angeles'
};
scenario.route('A request to POST /application/:id (received offer)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('for a logged in user and valid form data', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-black-mesa-uuid';
    sinonUtils.spy(Application.Instance.prototype, 'updateOrReplaceReceivedOfferReminder');
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/' + applicationId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
        htmlForm: validFormData, followRedirect: false,
        expectedStatusCode: 302, validateHtmlFormDifferent: true
      });

    it('runs `Application.updateOrReplaceReceivedOfferReminder()`', function () {
      // DEV: This verifies reminders are replaced when appropriate as tested in model tests
      var updateOrReplaceReceivedOfferReminderSpy = Application.Instance.prototype.updateOrReplaceReceivedOfferReminder;
      expect(updateOrReplaceReceivedOfferReminderSpy.callCount).to.equal(1);
    });

    it('updates our application in the database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(applications).to.have.length(1);
        expect(applications[0].get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');
        expect(applications[0].get('application_date_datetime').toISOString()).to.equal('2017-01-31T00:00:00.000Z');
        expect(applications[0].get('status')).to.equal('received_offer');
        expect(applications[0].get('name')).to.equal('Test Corporation');
        expect(applications[0].get('posting_url')).to.equal('http://google.com/');
        expect(applications[0].get('company_name')).to.equal('Test Corporation search');
        expect(applications[0].get('notes')).to.equal('Test notes');
        done();
      });
    });

    it('updates our reminder in the database', function (done) {
      ApplicationReminder.findAll().asCallback(function handleFindAll (err, reminders) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(reminders).to.have.length(1);
        expect(reminders[0].get('type')).to.equal('received_offer');
        expect(reminders[0].get('application_id')).to.equal('abcdef-black-mesa-uuid');
        expect(reminders[0].get('date_time_datetime').toISOString()).to.equal('2022-03-05T21:00:00.000Z');
        expect(reminders[0].get('date_time_timezone')).to.equal('US-America/Los_Angeles');
        expect(reminders[0].get('is_enabled')).to.equal(false);
        expect(reminders[0].get('sent_at_datetime')).to.equal(null);
        done();
      });
    });
  });

  scenario.routeTest('for a logged in user and invalid form data', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-black-mesa-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/' + applicationId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
        htmlForm: _.defaults({
          name: ''
        }, validFormData), followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: true
      });

    it('outputs validation errors on page', function () {
      expect(this.$('#validation-errors').text()).to.contain('Name cannot be empty');
    });

    it('reuses submitted values in headings/inputs/textareas', function () {
      expect(this.$('.content__subheading').text()).to.equal('');
      expect(this.$('input[name=posting_url]').val()).to.equal('http://google.com/');
      expect(this.$('input[name=company_name]').val()).to.equal('Test Corporation search');
      expect(this.$('input[name=application_date]').val()).to.equal('2017-01-31');
      expect(this.$('textarea[name=notes]').val()).to.equal('Test notes');
      expect(this.$('input[name=received_offer_reminder_enabled][value=yes]').attr('checked'))
        .to.equal(undefined);
      expect(this.$('input[name=received_offer_reminder_enabled][value=no]').attr('checked')).to.equal('checked');
      expect(this.$('input[name=received_offer_reminder_date]').val()).to.equal('2022-03-05');
      expect(this.$('input[name=received_offer_reminder_time]').val()).to.equal('13:00');
      expect(this.$('select[name=received_offer_reminder_timezone]').val()).to.equal('US-America/Los_Angeles');
    });
  });
});
