// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
var scenarioInfoArr = [
  {type: 'saved-for-later', url: '/application/abcdef-intertrode-uuid', name: 'Intertrode',
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'waiting-for-response', url: '/application/abcdef-sky-networks-uuid', name: 'Sky Networks',
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'upcoming-interview', url: '/application/abcdef-umbrella-corp-uuid', name: 'Umbrella Corporation',
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'received-offer', url: '/application/abcdef-black-mesa-uuid', name: 'Black Mesa',
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'archived', url: '/application/abcdef-monstromart-uuid', name: 'Monstromart',
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario.route('A request to GET /application/:id (generic/' + scenarioInfo.type + ')', {
    // DEV: We test nonExistent, nonOwner, and loggedOut after the `forEach` as they aren't type dependent
    requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
  }, function () {
    scenario.routeTest('from the owner user', {
      dbFixtures: scenarioInfo.dbFixtures
    }, function () {
      // Log in and make our request
      httpUtils.session.init().login()
        .save({url: serverUtils.getUrl(scenarioInfo.url), expectedStatusCode: 200});

      it('recieves the application page', function () {
        expect(this.$('.content__heading').text()).to.equal('Job application');
        expect(this.$('.content__subheading input').val()).to.equal(scenarioInfo.name);
      });

      it('receives the proper title', function () {
        // DEV: We have title testing as we cannot test it in visual tests
        expect(this.$('title').text()).to.equal('Job application - ' + scenarioInfo.name + ' - Find Work');
      });
    });
  });
});

scenario.route('A request to GET /application/:id (generic)', function () {
  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [dbFixtures.APPLICATION_INTERTRODE, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        url: serverUtils.getUrl('/application/abcdef-intertrode-uuid'),
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/does-not-exist'), expectedStatusCode: 404});

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/application/does-not-exist'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });

  scenario.routeTest.skip('with a company name', function () {
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('renders non-extended company research data', function () {
      expect(this.$('#company-results').text()).to.contain('Website: mock-domain.test');
      expect(this.$('#company-results').text()).to.not.contain('Culture and values rating');
    });
  });

  scenario.routeTest.skip('without a company name', function () {
    it('renders no company research data', function () {
      expect(this.$('#company-results').text()).to.contain('No company name entered');
    });
  });

  scenario.routeTest.skip('with upcoming interviews', function () {
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('renders upcoming interviews', function () {
      // Assert upcoming interviews
    });
  });

  scenario.routeTest.skip('with no upcoming interviews', function () {
    // TODO: Use archived page to verify we have upcoming interviews yet none listed
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('has no upcoming interviews container', function () {
      // Assert no upcoming interviews heading
    });
  });

  scenario.routeTest.skip('with past interviews', function () {
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('renders past interviews', function () {
      // Assert past interviews
    });
  });

  scenario.routeTest.skip('with no past interviews', function () {
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it.skip('renders empty state for past interviews', function () {
      // Assert no past interviews
      // Assert past interviews not found text
    });
  });
});
