// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to GET /application/:id from the owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it('recieves the application page', function () {
    expect(this.$('.content__heading').text()).to.equal('Job application');
    expect(this.$('.content__subheading input').val()).to.equal('Sky Networks');
  });

  it('receives the proper title', function () {
    // DEV: We have title testing as we cannot test it in visual tests
    expect(this.$('title').text()).to.equal('Job application - Sky Networks - Find Work');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    // **Name (not in add)**, URL, notes, company name
    expect(this.$('input[name=...]').val()).to.equal('Test me');
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

scenario('A request to an archived GET /application/:id', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-monstromart-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

  it('shows archive date', function () {
    expect(this.$('.archive-date').text()).to.contain('Mon Jan 18 at 3:00PM CST');
  });
});

scenario.skip('A request to GET /application/:id from a non-owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-uuid';
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 404});

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to GET /application/:id that doesn\'t exist', function () {
  // Log in (need to do) and make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/application/does-not-exist'), expectedStatusCode: 404});

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to GET /application/:id from a logged out user', function () {
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
