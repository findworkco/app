// Load in our dependencies
var fs = require('fs');
var qs = require('querystring');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var sinonUtils = require('../../utils/sinon');
var serverUtils = require('../utils/server');
var app = require('../utils/server').app;
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');

// Load in our contracts
var partialFullReqContract = fs.readFileSync(
  __dirname + '/../../test-files/http-contracts/research-company-partial-save-200-req.raw', 'utf8').trim();
var partialFullResContract = fs.readFileSync(
  __dirname + '/../../test-files/http-contracts/research-company-partial-save-200-res.html', 'utf8').trim();

// Start our tests
scenario.route('A request to POST /research-company to search', {
  requiredTests: {nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('with a matching company name', {
    glassdoorFixtures: ['/api/api.htm#full'],
    serveAnalytics: true
  }, function () {
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      });

    it('has company name field filled in', function () {
      var $companyNameInput = this.$('form[action="/research-company"] input[name="company_name"]');
      expect($companyNameInput.val()).to.equal('Mock company');
    });

    it('has company information', function () {
      var $results = this.$('#glassdoor-results');
      expect($results.text()).to.contain('Website: www.ibm.com');
      // DEV: This asserts we normalize URL length
      expect($results.find('a[href="http://www.ibm.com/"]')).to.have.length(1);
      expect($results.text()).to.contain('Industry: Consulting');
      expect($results.text()).to.contain('Overall rating: 3.4/5.0 (27258 ratings)');
      expect($results.text()).to.contain('CEO review: 62% approve, 38% disapprove (9547 ratings)');

      var $glassdoorCompanyLink = $results.find(
        'a[href="https://www.glassdoor.com/Overview/Working-at-IBM-EI_IE354.htm"]');
      expect($glassdoorCompanyLink).to.have.length(1);
      expect($glassdoorCompanyLink.text()).to.equal('View Glassdoor profile');

      var $glassdoorAttributionLink = $results.find(
        'a[href="https://www.glassdoor.com/Reviews/ibm-reviews-SRCH_KE0,3.htm"]');
      expect($glassdoorAttributionLink).to.have.length(1);

      expect($results.find('a[href^="https://docs.google.com/"]')).to.have.length(1);
      expect($results.find('a[href^="https://docs.google.com/"]').attr('href')).to.contain('Mock%20company');
      expect($results.find('a[href^="https://docs.google.com/"]').attr('href')).to.contain('354');
    });
    it('has extended company information', function () {
      var $results = this.$('#glassdoor-results');
      expect($results.text()).to.contain('Culture and values rating: 3.4/5.0');
      expect($results.text()).to.contain('Senior leadership rating: 2.9/5.0');
      expect($results.text()).to.contain('Compensation and benefits rating: 3.1/5.0');
      expect($results.text()).to.contain('Career opportunities rating: 3.3/5.0');
      expect($results.text()).to.contain('Work/Life balance rating: 3.6/5.0');
    });

    it('lists extended external links', function () {
      var $results = this.$('#external-links-results');
      expect($results.text()).to.contain('LinkedIn: Search');
      expect($results.html()).to.contain('https://www.linkedin.com/search/results/companies/?keywords=Mock%20company');
      expect($results.text()).to.contain('Crunchbase: Search');
      expect($results.html()).to.contain('https://www.crunchbase.com/app/search?q=Mock%20company');
      expect($results.text()).to.contain('AngelList: Search');
      expect($results.html()).to.contain('https://angel.co/search?type=companies&amp;q=Mock%20company');
      expect($results.text()).to.contain('StackShare: Search');
      expect($results.html()).to.contain('https://stackshare.io/search/q=Mock%20company');
      expect($results.text()).to.contain('GitHub: Search');
      expect($results.html()).to.contain(
        'https://github.com/search?type=Users&amp;utf8=%E2%9C%93&amp;q=Mock%20company');
    });

    it('has enabled forms for creating applications', function () {
      var $saveForLaterBtn = this.$('form[action="/add-application/save-for-later"] button[type=submit]');
      expect($saveForLaterBtn.length).to.equal(1);
      expect($saveForLaterBtn.attr('disabled')).to.equal(undefined);
      var $applyToCompanyBtn = this.$('form[action="/add-application/waiting-for-response"] button[type=submit]');
      expect($applyToCompanyBtn.length).to.equal(1);
      expect($applyToCompanyBtn.attr('disabled')).to.equal(undefined);
    });

    it('records analytics event', function () {
      expect(this.body).to.contain(
        'ga(\'send\', \'event\', "Research company", "search", "Mock company");');
    });
  });

  scenario.routeTest('with a matching company name yet blank contents', {
    glassdoorFixtures: ['/api/api.htm#blank']
  }, function () {
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      });

    it('has company name field filled in', function () {
      var $companyNameInput = this.$('form[action="/research-company"] input[name="company_name"]');
      expect($companyNameInput.val()).to.equal('Mock company');
    });

    it('lists blank fields', function () {
      var $results = this.$('#glassdoor-results');
      expect($results.text()).to.contain('Industry: Unknown');
      expect($results.text()).to.contain('CEO review: No reviews');
    });
  });

  scenario.nonExistent('with a non-matching company name', {
    glassdoorFixtures: ['/api/api.htm#empty'],
    serveAnalytics: true
  }, function () {
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'MissingNo'},
        followRedirect: false, expectedStatusCode: 200
      });

    it('has company name field filled in', function () {
      var $companyNameInput = this.$('form[action="/research-company"] input[name="company_name"]');
      expect($companyNameInput.val()).to.equal('MissingNo');
    });

    it('lists no company found', function () {
      var $results = this.$('#glassdoor-results');
      expect($results.text()).to.contain('No company found');
    });

    it('records analytics event', function () {
      expect(this.body).to.contain(
        'ga(\'send\', \'event\', "Research company", "search", "MissingNo");');
    });
  });

  scenario.routeTest('with no company name', {
    dbFixtures: null
  }, function () {
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: ''},
        followRedirect: false, expectedStatusCode: 200
      });

    it('doesn\'t have company name field filled in', function () {
      expect(this.$('form[action="/research-company"] input[name="company_name"]').val()).to.equal('');
    });

    it('has no company info listed', function () {
      expect(this.$('#glassdoor-results').text()).to.contain('No company found');
    });

    it('lists external links', function () {
      expect(this.$('#external-links-results').text()).to.contain('No company name entered');
    });
  });

  scenario.routeTest('that times out', {
    glassdoorFixtures: ['/api/api.htm#timeout']
  }, function () {
    sinonUtils.stub(app.winston, 'error');
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 500
      });

    it('errors out before receiving a response', function () {
      // Status code asserted by `expectedStatusCode`
      // Assert timeout error itself
      var winstonSpy = app.winston.error;
      expect(winstonSpy.callCount).to.equal(1);
      expect(winstonSpy.args[0][0].code).to.equal('ETIMEDOUT');
    });
  });

  scenario.routeTest('that encounters an error', {
    glassdoorFixtures: ['/api/api.htm#error']
  }, function () {
    sinonUtils.stub(app.winston, 'error');
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 500
      });

    it('records an error', function () {
      // Status code asserted by `expectedStatusCode`
      // Assert timeout error itself
      var winstonSpy = app.winston.error;
      expect(winstonSpy.callCount).to.equal(1);
      expect(winstonSpy.args[0][0].message).to.contain('Received unsuccessful response from Glassdoor');
      expect(winstonSpy.args[0][0].message).to.contain('Access-Denied');
    });
  });

  scenario.routeTest('from a logged in user', {
    dbFixtures: [dbFixtures.APPLICATION_INTERTRODE, dbFixtures.DEFAULT_FIXTURES],
    glassdoorFixtures: ['/api/api.htm#full']
  }, function () {
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-intertrode-uuid'))
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      });

    it('loads nav content', function () {
      expect(this.$('#nav').text()).to.contain('Intertrode');
    });
  });

  scenario.routeTest('for a partial', {
    glassdoorFixtures: ['/api/api.htm#full']
  }, function () {
    httpUtils.session.init()
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        headers: {'X-Partial': '1'},
        csrfForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      });

    it('replies with contracted content', function () {
      var actualReqQs = qs.parse(this.req.body);
      var expectedReqQs = qs.parse(partialFullReqContract);
      expect(actualReqQs).to.have.same.keys(expectedReqQs);
      expect(this.body).to.equal(partialFullResContract);
    });

    it('renders partial content', function () {
      var $glassdoorResults = this.$('#glassdoor-results');
      expect($glassdoorResults.text()).to.contain('Website: www.ibm.com');
      var $externalLinksResults = this.$('#external-links-results');
      expect($externalLinksResults.text()).to.contain('LinkedIn: Search');
      expect($externalLinksResults.text()).to.not.contain('GitHub');
    });

    it('doesn\'t render excess content', function () {
      expect(this.$('#nav')).to.have.length(0);
    });

    it('doesn\'t render extended content', function () {
      var $glassdoorResults = this.$('#glassdoor-results');
      expect($glassdoorResults.text()).to.not.contain('Culture and values rating');
    });
  });
});

// DEV: These tests are simple enough and provide a huge sanity check
//   for unexpected breaks between "add" behavior and this page
scenario.route('A request to POST /research-company to "Save for later"', {
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from a logged in user', {
    glassdoorFixtures: ['/api/api.htm#full']
  }, function () {
    // Login and make our multiple requests
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      })
      .save({
        method: 'POST', url: serverUtils.getUrl('/add-application/save-for-later'),
        htmlForm: true, followRedirect: false,
        expectedStatusCode: 302
      });

    it('opens to created application', function () {
      expect(this.res.headers.location).to.have.match(/^\/application\/[^\/]+$/);
    });

    it('creates saved for later application with name, company name, and default save for later reminder',
        function (done) {
      // DEV: We use `include` as `/add-applcation/save-for-later` does it more accurately/properly
      Application.findAll({include: [{model: ApplicationReminder, as: 'saved_for_later_reminder'}]})
          .asCallback(function handleFindAll (err, applications) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(applications).to.have.length(1);
        expect(applications[0].get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
        expect(applications[0].get('saved_for_later_reminder_id')).to.be.a('string');
        expect(applications[0].get('name')).to.equal('Mock company');
        expect(applications[0].get('company_name')).to.equal('Mock company');
        var reminder = applications[0].get('saved_for_later_reminder');
        // DEV: This is close to a tautological test but it verifies a range more than specifics
        // DEV: We subtract/add 2 hours as padding for daylight savings changes
        var oneWeekMoment = moment().add({weeks: 1}).subtract({hours: 2});
        var oneWeekAndTwoDaysMoment = moment().add({weeks: 1, days: 2}).add({hours: 2});
        expect(reminder.get('date_time_moment').isAfter(oneWeekMoment)).to.equal(true);
        expect(reminder.get('date_time_moment').isBefore(oneWeekAndTwoDaysMoment)).to.equal(true);
        done();
      });
    });
  });
});

scenario.route('A request to POST /research-company to "Apply to company"', {
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.loggedOut('from a logged out user', {
    glassdoorFixtures: ['/api/api.htm#full']
  }, function () {
    httpUtils.session.init()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      })
      .save({
        method: 'GET', url: serverUtils.getUrl('/add-application/waiting-for-response'),
        htmlForm: true, followRedirect: true, expectedStatusCode: 200
      });

    it('opens "Waiting for response" form with company name prefilled', function () {
      expect(this.$('title').text()).to.equal('Add job application - Waiting for response - Find Work');
      expect(this.$('input[name="name"]').val()).to.equal('Mock company');
      expect(this.$('input[name="company_name"]').val()).to.equal('Mock company');
    });
  });
});
