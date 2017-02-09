// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var fakeGoogleFactory = require('../utils/fake-google');
var httpUtils = require('../utils/http');
var Application = require('../../../server/models/application');
var serverUtils = require('../utils/server');
var savedForLaterTest = require('./application-add-form-save-for-later-save');
var waitingForResponseTest = require('./application-add-form-waiting-for-response-save');
var upcomingInterviewTest = require('./application-add-form-upcoming-interview-save');
var receivedOfferTest = require('./application-add-form-received-offer-save');

// Start our tests
// DEV: These are basic tests, one-off tests for specific forms are handled in separate files
var scenarioInfoArr = [
  {url: '/add-application/save-for-later', form: savedForLaterTest.validFormData},
  {url: '/add-application/waiting-for-response', form: waitingForResponseTest.validFormData},
  {url: '/add-application/upcoming-interview', form: upcomingInterviewTest.validFormData},
  {url: '/add-application/received-offer', form: receivedOfferTest.validFormData}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario.route('A request to POST ' + scenarioInfo.url + ' (generic)', {
    requiredTests: {nonExistent: false, nonOwner: false}
  }, function () {
    // DEV: Successful submission and validation will be tested in specific tests
    //   Otherwise, we would miss testing reminder ids and similar one-offs
    scenario.loggedOut('for a logged out user', {
      dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
      googleFixtures: fakeGoogleFactory.DEFAULT_FIXTURES
    }, function () {
      // Make our request
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.url))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.url),
          htmlForm: scenarioInfo.form, followRedirect: true, followAllRedirects: true,
          expectedStatusCode: 200, validateHtmlFormDifferent: false
        });

      it('redirects to login page', function () {
        expect(this.lastRedirect).to.have.property('statusCode', 302);
        expect(this.lastRedirect.redirectUri).to.have.match(/\/login$/);
      });

      it('shows message about requiring login', function () {
        expect(this.$('.section--info').text()).to.contain('need to sign up/log in');
      });

      describe('on visiting sign up page', function () {
        httpUtils.session
          .save({
            url: serverUtils.getUrl('/sign-up'),
            expectedStatusCode: 200
          });

        it('shows message about requiring login', function () {
          expect(this.$('.section--info').text()).to.contain('need to sign up/log in');
        });

        describe('on signup completion', function () {
          httpUtils.session.login();

          it('redirects to the new application\'s page', function () {
            expect(this.redirects).to.have.length(2);
            expect(this.redirects[0]).to.have.property('statusCode', 302);
            expect(this.redirects[0].redirectUri).to.match(/\?autosubmit=true$/);
            expect(this.lastRedirect).to.have.property('statusCode', 302);
            expect(this.lastRedirect.redirectUri).to.have.match(/\/application\/[^\/]+$/);
          });

          it('creates our application in the database', function (done) {
            // DEV: See specific tests for more details
            Application.findAll().asCallback(function handleFindAll (err, applications) {
              if (err) { return done(err); }
              expect(applications).to.have.length(1);
              done();
            });
          });

          it('notifies user of creation success', function () {
            expect(this.$('#notification-content > [data-notification=success]').text())
              .to.equal('Application created');
          });

          describe('on subsequent revisits to our magic URL', function () {
            httpUtils.session.save({
                url: serverUtils.getUrl({
                  pathname: scenarioInfo.url,
                  query: {autosubmit: 'true'}
                }),
                followRedirect: false,
                expectedStatusCode: 200
              });

            it('doesn\'t redirect to a new application\'s page', function () {
              // Asserted by expectedStatusCode
            });

            it('doesn\'t create more applications', function (done) {
              Application.findAll().asCallback(function handleFindAll (err, applications) {
                if (err) { return done(err); }
                expect(applications).to.have.length(1);
                done();
              });
            });
          });
        });
      });
    });

    scenario.routeTest('for a logged in user', {
      dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
    }, function () {
      // Make our request
      httpUtils.session.init().login()
        .save(serverUtils.getUrl(scenarioInfo.url))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.url),
          htmlForm: scenarioInfo.form, followRedirect: false,
          expectedStatusCode: 302, validateHtmlFormDifferent: false
        });

      describe('on subsequent visits to our magic URL', function () {
        httpUtils.session.save({
            url: serverUtils.getUrl({
              pathname: scenarioInfo.url,
              query: {autosubmit: 'true'}
            }),
            followRedirect: false,
            expectedStatusCode: 200
          });

        it('doesn\'t redirect to a new application\'s page', function () {
          // Asserted by expectedStatusCode
        });

        it('doesn\'t create more applications', function (done) {
          Application.findAll().asCallback(function handleFindAll (err, applications) {
            if (err) { return done(err); }
            expect(applications).to.have.length(1);
            done();
          });
        });
      });
    });

    scenario.routeTest('for a logged out user', {
      dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
    }, function () {
      // Make our request
      httpUtils.session.init()
        .save(serverUtils.getUrl(scenarioInfo.url))
        .save({
          method: 'POST', url: serverUtils.getUrl(scenarioInfo.url),
          htmlForm: scenarioInfo.form, followRedirect: false,
          expectedStatusCode: 302, validateHtmlFormDifferent: false
        });

      it('redirects to sign up page', function () {
        expect(this.res.headers).to.have.property('location', '/login');
      });

      describe('on login completion for another page', function () {
        httpUtils.session
          .save({
            url: serverUtils.getUrl('/settings'),
            followRedirect: false,
            expectedStatusCode: 302
          })
          .login();

        it('redirects to other page', function () {
          expect(this.lastRedirect).to.have.property('statusCode', 302);
          expect(this.lastRedirect.redirectUri).to.have.match(/\/settings$/);
        });

        it('doesn\'t create any applications', function (done) {
          Application.findAll().asCallback(function handleFindAll (err, applications) {
            if (err) { return done(err); }
            expect(applications).to.have.length(0);
            done();
          });
        });
      });
    });
  });
});
