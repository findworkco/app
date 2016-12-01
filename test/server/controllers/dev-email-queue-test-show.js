// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var sinonUtils = require('../utils/sinon');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /_dev/email/queue/test', {
  requiredTests: {loggedOut: false, nonOwner: false, nonExistent: false}
}, function () {
  scenario.routeTest('from a logged in user', function () {
    // Log in and make our request
    serverUtils.stubEmails();
    sinonUtils.spy(serverUtils.app.kueQueue, 'create');
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl('/_dev/email/queue/test'),
      expectedStatusCode: 200
    });

    it('calls our queue', function () {
      var queueCreateSpy = serverUtils.app.kueQueue.create;
      expect(queueCreateSpy.callCount).to.equal(1);
    });

    it('sends a test email', function () {
      var emailSendStub = this.emailSendStub;
      expect(emailSendStub.callCount).to.equal(1);
      expect(emailSendStub.args[0][0].data.text).to.contain(
        'welcome.com/queue');
    });
  });
});
