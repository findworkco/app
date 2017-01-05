// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var savedForLaterTest = require('./application-add-form-save-for-later-show');
var waitingForResponseTest = require('./application-add-form-waiting-for-response-show');

// Start our tests
// DEV: These are basic tests, one-off tests for specific forms are handled in separate files
var commonFormData = {
  name: 'Test Corporation',
  posting_url: 'http://google.com/',
  company_name: 'Test Corporation search',
  notes: 'Test notes'
};
var scenarioInfoArr = [
  {url: '/add-application/save-for-later', form: savedForLaterTest.validFormData},
  {url: '/add-application/waiting-for-response', form: waitingForResponseTest.validFormData},
  {url: '/add-application/upcoming-interview', form: _.defaults({}, commonFormData)},
  {url: '/add-application/received-offer', form: _.defaults({}, commonFormData)}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario.route('A request to POST ' + scenarioInfo.url + ' (generic)', {
    requiredTests: {nonExistent: false, nonOwner: false}
  }, function () {
    // DEV: Successful submission and validation will be tested in specific tests
    //   Otherwise, we would miss testing reminder ids and similar one-offs
    scenario.loggedOut('for a logged out user', function () {
      // Make our request
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.url))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.url),
          htmlForm: true, followRedirect: false,
          expectedStatusCode: 302
        });

      it('redirects to sign up page', function () {
        expect(this.res.headers).to.have.property('location', '/login');
      });

      describe.skip('on signup completion', function () {
        it('redirects to the new application\'s page', function () {
        });

        it('creates our application in the database', function () {
          // Verify data in PostgreSQL
        });

        describe('on redirect completion', function () {
          httpUtils.session.save(serverUtils.getUrl('/schedule'));

          it('notifies user of creation success', function () {
            expect(this.$('#notification-content > [data-notification=success]').text())
              .to.equal('Application saved');
          });
        });
      });
    });
  });
});
