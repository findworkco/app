// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /settings', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from a logged in user', function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/settings'), expectedStatusCode: 200});

    it('recieves the settings page', function () {
      expect(this.$('.content__heading').text()).to.equal('Settings');
    });

    it('shows candidate info in fields', function () {
      expect(this.$('input[name=email]').val()).to.equal('mock-email@mock-domain.test');
      expect(this.$('select[name=timezone]').val()).to.equal('US-America/Chicago');
      expect(this.$('form[action="/delete-account"]').attr('data-confirm-submit'))
        .to.contain('mock-email@mock-domain.test');
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/settings'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    it('is redirected to the /login page', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
