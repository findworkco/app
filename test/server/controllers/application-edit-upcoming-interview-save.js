// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var Application = require('../../../server/models/application');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
var validFormData = exports.validFormData = {
  name: 'Test Corporation',
  posting_url: 'http://google.com/',
  company_name: 'Test Corporation search',
  notes: 'Test notes',
  application_date: '2017-01-31'
};
scenario.route('A request to POST /application/:id (upcoming interview)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('for a logged in user and valid form data', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-umbrella-corp-uuid';
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/' + applicationId))
      .save({
        method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
        htmlForm: validFormData, followRedirect: false,
        expectedStatusCode: 302, validateHtmlFormDifferent: true
      });

    it('updates our application in the database', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(applications).to.have.length(1);
        expect(applications[0].get('application_date_datetime').toISOString()).to.equal('2017-01-31T00:00:00.000Z');
        expect(applications[0].get('status')).to.equal('upcoming_interview');
        expect(applications[0].get('name')).to.equal('Test Corporation');
        expect(applications[0].get('posting_url')).to.equal('http://google.com/');
        expect(applications[0].get('company_name')).to.equal('Test Corporation search');
        expect(applications[0].get('notes')).to.equal('Test notes');
        done();
      });
    });
  });

  scenario.routeTest('for a logged in user and invalid form data', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-umbrella-corp-uuid';
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
    });
  });
});
