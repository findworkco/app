// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
var scenarioInfoArr = [
  {type: 'save-for-later', url: '/application/abcdef-intertrode-uuid', name: 'Intertrode'},
  {type: 'waiting-for-response', url: '/application/abcdef-sky-networks-uuid', name: 'Sky Networks'},
  {type: 'upcoming-interview', url: '/application/abcdef-umbrella-corp-uuid', name: 'Umbrella Corporation'},
  {type: 'received-offer', url: '/application/abcdef-black-mesa-uuid', name: 'Black Mesa'},
  {type: 'archived', url: '/application/abcdef-monstromart-uuid', name: 'Monstromart'}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario('A request to GET /application/:id (generic/' + scenarioInfo.type + ') from the owner user', function () {
    // Log in (need to do) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl(scenarioInfo.url), expectedStatusCode: 200});

    it('recieves the application page', function () {
      expect(this.$('.content__heading').text()).to.equal('Job application');
      expect(this.$('.content__subheading input').val()).to.equal(scenarioInfo.name);
    });

    it('receives the proper title', function () {
      // DEV: We have title testing as we cannot test it in visual tests
      expect(this.$('title').text()).to.equal('Job application - ' + scenarioInfo.name + ' - Find Work');
    });

    // Test that all fields exist
    it.skip('has our expected fields', function () {
      // Name, URL, notes, company name
      expect(this.$('input[name=...]').val()).to.equal('Test me');
    });
  });

  scenario.skip('A request to GET /application/:id from a non-owner user', function () {
    // Log in (need to do) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl(scenarioInfo.url), expectedStatusCode: 404});

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });
});

scenario.skip('A request to GET /application/:id (generic) that doesn\'t exist', {
  dbFixtures: null
}, function () {
  // Log in (need to do) and make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/does-not-exist'), expectedStatusCode: 404});

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to GET /application/:id (generic) from a logged out user', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/application/does-not-exist'),
    followRedirect: false,
    expectedStatusCode: 302
  });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});

scenario('A request to GET /application/:id with a company name', function () {
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('renders non-extended company research data', function () {
    expect(this.$('#company-results').text()).to.contain('Website: mock-domain.test');
    expect(this.$('#company-results').text()).to.not.contain('Culture and values rating');
  });
});

scenario.skip('A request to GET /application/:id without a company name', function () {
  it('renders no company research data', function () {
    expect(this.$('#company-results').text()).to.contain('No company name entered');
  });
});

scenario.skip('A request to GET /application/:id with upcoming interviews', function () {
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('renders upcoming interviews', function () {
    // Assert upcoming interviews
  });
});

scenario.skip('A request to GET /application/:id with no upcoming interviews', function () {
  // TODO: Use archived page to verify we have upcoming interviews yet none listed
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('has no upcoming interviews container', function () {
    // Assert no upcoming interviews heading
  });
});

scenario.skip('A request to GET /application/:id with past interviews', function () {
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('renders past interviews', function () {
    // Assert past interviews
  });
});

scenario.skip('A request to GET /application/:id with no past interviews', function () {
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it.skip('renders empty state for past interviews', function () {
    // Assert no past interviews
    // Assert past interviews not found text
  });
});
