// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
// DEV: These are basic tests, one-off tests for specific forms are handled in separate files
var scenarioInfoArr = [
  {url: '/add-application/save-for-later'},
  {url: '/add-application/waiting-for-response'},
  {url: '/add-application/upcoming-interview'},
  {url: '/add-application/received-offer'}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario.route('A request to GET ' + scenarioInfo.url + ' (generic)', {
    requiredTests: {nonExistent: false, nonOwner: false}
  }, function () {
    scenario.loggedOut('from a logged out user', function () {
      // Make our request
      httpUtils.session.init()
        .save({url: serverUtils.getUrl(scenarioInfo.url), expectedStatusCode: 200});

      it('recieves the add application page', function () {
        expect(this.$('.content__heading').text()).to.equal('Add job application');
      });

      it('renders empty research company form', function () {
        expect(this.$('#glassdoor-results').text()).to.contain('No company name entered');
        expect(this.$('#external-links-results').text()).to.contain('No company name entered');
      });

      // DEV: We rely on `htmlForm` and `add-form-save` tests to verify field presence
      //   There's no data being loaded from the database to verify
      //   Only the field content on validation and save
    });
  });
});
