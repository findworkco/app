// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
// DEV: These are basic tests, one-off tests for specific forms are handled in separate files
var scenarioInfoArr = [
  {url: '/add-application/save-for-later', form: {}},
  {url: '/add-application/waiting-for-response', form: {}},
  {url: '/add-application/upcoming-interview', form: {}},
  {url: '/add-application/received-offer', form: {}}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario.route('A request to POST ' + scenarioInfo.url, {
    requiredTests: {nonExistent: false, nonOwner: false}
  }, function () {
    scenario.routeTest('for a logged in user', function () {
      // Login and make our request
      // TODO: Complete form for test
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.url))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.url),
          htmlForm: true, followRedirect: false,
          expectedStatusCode: 302
        });

      it('redirects to the new application\'s page', function () {
        expect(this.res.headers.location).to.have.match(/^\/application\/[^\/]+$/);
      });

      it.skip('creates our application in the database', function () {
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

    scenario.loggedOut.skip('for a logged out user', function () {
      // Make our request
      // TODO: Complete form for test
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
