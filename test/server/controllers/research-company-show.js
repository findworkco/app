// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /research-company', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/research-company'), expectedStatusCode: 200});

    it('recieves the Research company page', function () {
      expect(this.$('title').text()).to.equal('Research company - Find Work');
    });
    it('has expected fields', function () {
      expect(this.$('form[action="/research-company"] input[name="company_name"]').length).to.equal(1);
    });
    it('has no company information', function () {
      expect(this.$('#glassdoor-results').text()).to.contain('No company name entered');
      expect(this.$('#external-links-results').text()).to.contain('No company name entered');
    });
    it('has disabled forms for creating applications', function () {
      var $saveForLaterBtn = this.$('form[action="/add-application/save-for-later"] button[type=submit]');
      expect(this.$($saveForLaterBtn).attr('disabled')).to.equal('disabled');
      var $applyToCompanyBtn = this.$('form[action="/add-application/waiting-for-response"] button[type=submit]');
      expect(this.$($applyToCompanyBtn).attr('disabled')).to.equal('disabled');
    });
  });
});
