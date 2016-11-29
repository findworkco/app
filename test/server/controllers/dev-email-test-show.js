// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /_dev/email/test', {
  requiredTests: {loggedOut: false, nonOwner: false, nonExistent: false}
}, function () {
  scenario.routeTest('from a logged in user', function () {
    // Log in and make our request
    serverUtils.stubEmails();
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl('/_dev/email/test'),
      expectedStatusCode: 200
    });

    it('sends a test email', function () {
      var emailSendStub = this.emailSendStub;
      expect(emailSendStub.callCount).to.equal(1);
      var data = emailSendStub.args[0][0].data;
      expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
      expect(data.to).to.equal('todd@findwork.co');
      expect(data.text).to.contain('This is a test text email');
      expect(data.text).to.contain('welcome.com');
      expect(data.html).to.contain('This is a test HTML email');
      expect(data.html).to.contain('welcome.com');
    });
  });
});
