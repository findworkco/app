// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
// TODO: Add tests for AngelList logged in state/not when searching for companies
scenario('A request to POST /research-company with a company name', {
  dbFixtures: null
}, function () {
  httpUtils.session.init()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: function ($form) {
        $form.find('input[name="company_name"]').val('Mock company');
      },
      followRedirect: false, expectedStatusCode: 200
    });

  it('has company name field filled in', function () {
    var $companyNameInput = this.$('form[action="/research-company"] input[name="company_name"]');
    expect($companyNameInput.val()).to.equal('Mock company');
  });
  it('has company information', function () {
    expect(this.$('#glassdoor-results').text()).to.contain('Website: www.ibm.com');
    expect(this.$('#angellist-results').text()).to.contain('Website: http://angel.co');
  });
  it('has extended company information', function () {
    expect(this.$('#glassdoor-results').text()).to.contain('Culture and values rating: 0.0/5.0');
    expect(this.$('#angellist-results').text()).to.contain('Blog URL: http://blog.angel.co');
  });
  it('has enabled forms for creating applications', function () {
    var $saveForLaterBtn = this.$('form[action="/add-application/save-for-later"] button[type=submit]');
    expect($saveForLaterBtn.length).to.equal(1);
    expect($saveForLaterBtn.attr('disabled')).to.equal(undefined);
    var $applyToCompanyBtn = this.$('form[action="/add-application/waiting-for-response"] button[type=submit]');
    expect($applyToCompanyBtn.length).to.equal(1);
    expect($applyToCompanyBtn.attr('disabled')).to.equal(undefined);
  });
  it.skip('requests from cache for company info', function () {
    // TODO: Figure out if we want to test caching logic/not
  });
});

scenario('A request to POST /research-company with no company name', {
  dbFixtures: null
}, function () {
  httpUtils.session.init()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: function ($form) {
        $form.find('input[name="company_name"]').val('');
      },
      followRedirect: false, expectedStatusCode: 200
    });

  it('doesn\'t have company name field filled in', function () {
    expect(this.$('form[action="/research-company"] input[name="company_name"]').val()).to.equal('');
  });
  it('has no company info listed', function () {
    expect(this.$('#glassdoor-results').text()).to.contain('No company name entered');
    expect(this.$('#angellist-results').text()).to.contain('No company name entered');
  });
  it.skip('doesn\'t request from cache for company info', function () {
    // TODO: Figure out if we want to test caching logic/not
  });
});

scenario('A request to POST /research-company from a logged in user', function () {
  httpUtils.session.init().login()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: function ($form) {
        $form.find('input[name="company_name"]').val('Mock company');
      },
      followRedirect: false, expectedStatusCode: 200
    });

  it.skip('has applications listed in sidebar', function () {
    // Test me once application data in sidebar is stablized
  });
});

// DEV: These tests are simple enough and provide a huge sanity check
//   for unexpected breaks between "add" behavior and this page
scenario('A request to "Save for later" from POST /research-company', function () {
  // Login and make our multiple requests
  httpUtils.session.init().login()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: function ($form) {
        $form.find('input[name="company_name"]').val('Mock company');
      },
      followRedirect: false, expectedStatusCode: 200
    })
    .save({
      method: 'POST', url: serverUtils.getUrl('/add-application/save-for-later'),
      // DEV: We need to use `followAllRedirects` due to more than 1 redirect
      htmlForm: true, followRedirect: true, followAllRedirects: true, expectedStatusCode: 200
    });

  it.skip('opens to created application', function () {
    // Currently failing due to mock data but super close
    expect(this.$('title').text()).to.equal('Job application - Mock company - Find Work');
  });

  it.skip('creates saved for later application with company name', function () {
    // Assert against database and verify 200 response
  });
});

scenario('A request to "Apply to company" from POST /research-company', {
  dbFixtures: null
}, function () {
  httpUtils.session.init()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: function ($form) {
        $form.find('input[name="company_name"]').val('Mock company');
      },
      followRedirect: false, expectedStatusCode: 200
    })
    .save({
      method: 'GET', url: serverUtils.getUrl('/add-application/waiting-for-response'),
      htmlForm: true, followRedirect: true, expectedStatusCode: 200
    });

  it('opens "Waiting for response" form with company name prefilled', function () {
    expect(this.$('title').text()).to.equal('Add job application - Waiting for response - Find Work');
    expect(this.$('input[name="company_name"]').val()).to.equal('Mock company');
  });
});

