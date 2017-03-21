// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var queue = require('../../../server/queue');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');

// Start our tests
var validFormData = {
  email: 'mock-email@mock-domain.test'
};
scenario.route('A request to POST /login/email/request (specific)', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', {
    dbFixtures: null
  }, function () {
    // Make our request
    sinonUtils.spy(queue, 'create');
    serverUtils.stubEmails();
    httpUtils.session.init()
      .save(serverUtils.getUrl('/login'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/login/email/request'),
        htmlForm: validFormData, followRedirect: false,
        expectedStatusCode: 302, validateHtmlFormDifferent: true
      });

    it('is redirected to /login/email', function () {
      expect(this.res.headers.location).to.equal('/login/email');
    });

    it('sends email containing token', function () {
      var queueCreateSpy = queue.create;
      expect(queueCreateSpy.callCount).to.equal(1);
      var emailSendStub = this.emailSendStub;
      expect(emailSendStub.callCount).to.equal(1);
      expect(emailSendStub.args[0][0].data.to).to.equal('mock-email@mock-domain.test');
      expect(emailSendStub.args[0][0].data.subject).to.equal('Email log in');
      expect(emailSendStub.args[0][0].data.html).to.contain(
        'https://findwork.test/login/email/callback?token=ABCDEF123');
      expect(emailSendStub.args[0][0].data.html).to.contain(
        'https://findwork.test/login/email');
      expect(emailSendStub.args[0][0].data.html).to.contain('Token: ABCDEF123');
    });
  });

  scenario.routeTest('without a valid email', {
    dbFixtures: null
  }, function () {
    // Make our request
    httpUtils.session.init()
      .save(serverUtils.getUrl('/login'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/login/email/request'),
        htmlForm: _.defaults({
          email: ''
        }, validFormData),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 400, validateHtmlFormDifferent: false
      });

    it('is redirected to /login', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/login$/);
    });

    it('displays auth error', function () {
      expect(this.$('.section--error').text()).to.contain('No email was provided');
    });
  });
});
