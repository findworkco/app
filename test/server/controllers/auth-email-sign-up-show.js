// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');

// Start our tests
var validFormData = {
  email: 'mock-email@mock-domain.test'
};
scenario.route('A request to GET /sign-up/email (specific)', {
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from a user who hasn\'t submitted a request', {
    dbFixtures: null
  }, function () {
    // Make our request
    serverUtils.stubEmails();
    httpUtils.session.init()
      .save({
        url: serverUtils.getUrl('/sign-up/email'),
        followRedirect: true,
        expectedStatusCode: 400
      });

    it('is redirected to /sign-up', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/sign-up$/);
    });

    it('displays auth error', function () {
      expect(this.$('.section--error').text()).to.contain(
        'Email authentication request has expired. Please try signing up again');
    });
  });

  scenario.routeTest('from a user who has submitted a request', {
    dbFixtures: null
  }, function () {
    // Make our request
    serverUtils.stubEmails();
    httpUtils.session.init()
      .save(serverUtils.getUrl('/sign-up'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/sign-up/email/request'),
        htmlForm: validFormData, followRedirect: false,
        expectedStatusCode: 302
      })
      .save({
        url: serverUtils.getUrl('/sign-up/email'),
        followRedirect: false,
        expectedStatusCode: 200
      });

    it('loads page with email address', function () {
      expect(this.$('input[name=email]').attr('disabled')).to.equal('disabled');
      expect(this.$('input[name=email]').val()).to.equal('mock-email@mock-domain.test');
    });
  });

  scenario.routeTest('from a user with an expired request', {
    dbFixtures: null
  }, function () {
    // Make our request
    serverUtils.stubEmails();
    sinonUtils.swap(serverUtils.config, 'authEmailTimeout', -100); // -100ms
    httpUtils.session.init()
      .save(serverUtils.getUrl('/sign-up'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/sign-up/email/request'),
        htmlForm: validFormData, followRedirect: false,
        expectedStatusCode: 302
      })
      .save({
        url: serverUtils.getUrl('/sign-up/email'),
        followRedirect: true,
        expectedStatusCode: 400
      });

    it('is redirected to /sign-up', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/sign-up$/);
    });

    it('displays auth error', function () {
      expect(this.$('.section--error').text()).to.contain(
        'Email authentication request has expired. Please try signing up again');
    });
  });
});
