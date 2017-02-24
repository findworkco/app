// Load in our dependencies
var _ = require('underscore');
var cheerio = require('cheerio');
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var fakeGoogleFactory = require('../utils/fake-google');
var httpUtils = require('../utils/http');
var Application = require('../../../server/models/application');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');
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

    scenario.routeTest('for a logged in user (multiple visits)', {
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

    scenario.routeTest('for a logged out user (abandoned login)', {
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

// DEV: We break these tests out as they are mostly edge cases
var nameRetrieveUrl = '/add-application/save-for-later';
var validNameRetrieveFormData = _.defaults({
  name: '',
  posting_url: 'http://mock-subdomain.findwork.co/'
}, savedForLaterTest.validFormData);
scenario.route('A name-retrieving request to POST /add-application/:status', {
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('with a posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: validNameRetrieveFormData, followRedirect: false,
        expectedStatusCode: 302, validateHtmlFormDifferent: false
      });

    // DEV: We assert no fetch occurring in other scenarios as they would get ECONNREFUSED
    it('requests application name from our posting URL', function () {
      var responseSpy = this.externalProxy.getFixtureSpy('/#valid');
      expect(responseSpy.callCount).to.equal(1);
      expect(responseSpy.lastRequest.url).to.equal('http://mock-subdomain.findwork.co/');
    });

    it('creates our application with the requested page\'s title', function (done) {
      Application.findAll().asCallback(function handleFindAll (err, applications) {
        if (err) { return done(err); }
        expect(applications).to.have.length(1);
        expect(applications[0].get('name')).to.equal('External mock name');
        done();
      });
    });
  });

  scenario.routeTest('without a posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: _.defaults({
          posting_url: ''
        }, validNameRetrieveFormData),
        followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('Missing name and posting URL');
    });
  });

  scenario.routeTest('with a timeout error', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#timeout']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: validNameRetrieveFormData, followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('We were unable to retrieve application name');
    });
  });

  scenario.routeTest('for a title-less posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#no-title']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: validNameRetrieveFormData, followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('We were unable to retrieve application name');
    });
  });

  scenario.routeTest('for a malformed HTML posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Stub Cheerio and make our request
    var _load = cheerio.load;
    sinonUtils.stub(cheerio, 'load', function stubCheerioLoad (html) {
      if (html.indexOf('<title>External mock') !== -1) {
        throw new Error('Malformed HTML');
      } else {
        return _load.apply(this, arguments);
      }
    });
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: validNameRetrieveFormData, followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('We were unable to retrieve application name');
    });
  });

  scenario.routeTest('for a non-HTTP/HTTPS posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: _.defaults({
          posting_url: 'ftp://google.com/'
        }, validNameRetrieveFormData), followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('We were unable to retrieve application name');
    });

    it('doesn\'t request our page', function () {
      var responseSpy = this.externalProxy.getFixtureSpy('/#valid');
      expect(responseSpy.callCount).to.equal(0);
    });
  });

  scenario.routeTest('for an IP based posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: _.defaults({
          posting_url: 'http://127.0.20.1/'
        }, validNameRetrieveFormData), followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('We were unable to retrieve application name');
    });

    it('doesn\'t request our page', function () {
      var responseSpy = this.externalProxy.getFixtureSpy('/#valid');
      expect(responseSpy.callCount).to.equal(0);
    });
  });

  scenario.routeTest('for a remapped posting URL', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: _.defaults({
          posting_url: 'http://localhost/'
        }, validNameRetrieveFormData), followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('receives a validation error', function () {
      expect(this.$('#validation-errors').text()).to.contain('We were unable to retrieve application name');
    });

    it('doesn\'t request our page', function () {
      var responseSpy = this.externalProxy.getFixtureSpy('/#valid');
      expect(responseSpy.callCount).to.equal(0);
    });
  });

  scenario.routeTest('with an unrelated validation error', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
    externalProxyFixtures: ['/#valid']
  }, function () {
    // Make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl(nameRetrieveUrl))
      .save({
        method: 'POST', url: serverUtils.getUrl(nameRetrieveUrl),
        htmlForm: _.defaults({
          saved_for_later_reminder_enabled: 'yes',
          saved_for_later_reminder_date: '2016-01-01'
        }, validNameRetrieveFormData), followRedirect: false,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('re-renders page with name filled in', function () {
      expect(this.$('input[name=name]').val()).to.equal('External mock name');
    });
  });
});
