// Load in our dependencies
var expect = require('chai').expect;
var app = require('./utils/server').app;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario('A request for a page with a non-critical error', {
  dbFixtures: null
}, function () {
  // Spy on Sentry, silence Winston, and make our request
  sinonUtils.spy(app.sentryClient, 'captureError');
  sinonUtils.stub(app.notWinston, 'error');
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/error/non-critical-error'),
    expectedStatusCode: 200
  });

  it('receives a 200 response', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });

  it('renders page content', function () {
    expect(this.body).to.equal('Non-critical error captured');
  });

  it('reports the error to Sentry', function () {
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(1);
  });
});
