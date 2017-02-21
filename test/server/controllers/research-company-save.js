// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var Application = require('../../../server/models/application');
var ApplicationReminder = require('../../../server/models/application-reminder');

// Start our tests
// TODO: Add tests for AngelList logged in state/not when searching for companies
scenario.route('A request to POST /research-company to search', {
  requiredTests: {nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('with a matching company name', function () {
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

    it('lists AngelList result as coming soon', function () {
      expect(this.$('#angellist-results').text()).to.contain('AngelList support is under construction');
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

  scenario.nonExistent('with a non-matching company name', function () {
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

    it.skip('requests from cache for company info', function () {
      // TODO: Figure out if we want to test caching logic/not
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

    it('lists AngelList result as coming soon', function () {
      expect(this.$('#angellist-results').text()).to.contain('AngelList support is under construction');
    });

    it.skip('doesn\'t request from cache for company info', function () {
      // TODO: Figure out if we want to test caching logic/not
    });
  });

  scenario.routeTest('from a logged in user', function () {
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/research-company'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/research-company'),
        htmlForm: {company_name: 'Mock company'},
        followRedirect: false, expectedStatusCode: 200
      });

    it.skip('has applications listed in sidebar', function () {
      // Test me once application data in sidebar is stablized
    });
  });
});

// DEV: These tests are simple enough and provide a huge sanity check
//   for unexpected breaks between "add" behavior and this page
scenario.route('A request to POST /research-company to "Save for later"', {
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from a logged in user', function () {
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
        var oneWeekMoment = moment().add({weeks: 1});
        var oneWeekAndTwoDaysMoment = moment().add({weeks: 1, days: 2});
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
  scenario.loggedOut('from a logged out user', function () {
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
