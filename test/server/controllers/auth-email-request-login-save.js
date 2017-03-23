// Load in our dependencies
var crypto = require('crypto');
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
    var _randomBytes = crypto.randomBytes;
    sinonUtils.stub(crypto, 'randomBytes', function (len, cb) {
      if (cb && cb.name === 'handleRandomBytes') {
        var buff = Buffer.alloc(len, 0);
        buff.writeInt8(0x01, 1);
        buff.writeInt8(0x02, 2);
        cb(null, buff);
      } else {
        return _randomBytes.apply(crypto, arguments);
      }
    });
    sinonUtils.spy(queue, 'create');
    serverUtils.stubEmails();
    httpUtils.session.init()
      .save(serverUtils.getUrl('/login'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/login/email/request'),
        htmlForm: validFormData, followRedirect: false,
        expectedStatusCode: 302, waitForJobs: 1,
        validateHtmlFormDifferent: true
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
        'https://findwork.test/login/email/callback?token=DA55QZ');
      expect(emailSendStub.args[0][0].data.html).to.contain(
        'https://findwork.test/login/email');
      expect(emailSendStub.args[0][0].data.html).to.contain('Token: DA55QZ');
    });

    it('adds token to session', function (done) {
      serverUtils.getSession(function handleGetSession (err, session) {
        if (err) { return done(err); }
        expect(session).to.have.property('authEmail');
        expect(session).to.have.property('authEmailAttempts');
        expect(session).to.have.property('authEmailTokenHash');
        expect(session).to.have.property('authEmailExpiresAt');
        done();
      });
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

    it('doesn\'t add token to session', function (done) {
      serverUtils.getSession(function handleGetSession (err, session) {
        if (err) { return done(err); }
        expect(session).to.not.have.property('authEmail');
        expect(session).to.not.have.property('authEmailAttempts');
        expect(session).to.not.have.property('authEmailTokenHash');
        expect(session).to.not.have.property('authEmailExpiresAt');
        done();
      });
    });
  });
});
