// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
// TODO: These are basic tests, one-off tests like specific field handling should be done in one-off files
var scenarioInfoArr = [
  {url: '/add-application/save-for-later'},
  {url: '/add-application/waiting-for-response'},
  {url: '/add-application/upcoming-interview'},
  {url: '/add-application/received-offer'}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario('A request to GET ' + scenarioInfo.url + ' (generic)', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl(scenarioInfo.url), expectedStatusCode: 200});

    it('recieves the add application page', function () {
      expect(this.$('.content__heading').text()).to.equal('Add job application');
    });

    // Test that all fields exist
    it.skip('has our expected fields', function () {
      // Posting URL, notes, research company, back button
      expect(this.$('input[name=...]').val()).to.equal('Test me');
    });
  });
});