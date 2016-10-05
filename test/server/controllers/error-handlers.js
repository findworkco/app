// Load in our dependencies
var expect = require('chai').expect;
var app = require('../utils/server').app;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');
var Response = require('express/lib/response');

// Start our tests
describe('A request for a missing page', function () {
  // Start our server, spy on Sentry, and make our request
  serverUtils.run();
  sinonUtils.spy(app.sentryClient, 'captureError');
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/_dev/404'),
    expectedStatusCode: 404
  });

  it('receives a 404 response', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });

  it('receives helpful information', function () {
    expect(this.$('title').text()).to.equal('Page not found - Find Work');
    expect(this.body).to.contain('We were unable to find the requested page');
  });

  it('doesn\'t report the error to Sentry', function () {
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(0);
  });
});

describe('A request for a page with a server error', function () {
  // Start our server, spy on Sentry, silence Winston, and make our request
  serverUtils.run();
  sinonUtils.spy(app.sentryClient, 'captureError');
  sinonUtils.stub(app.notWinston, 'error');
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/_dev/500'),
    expectedStatusCode: 500
  });

  it('receives a 500 response', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });

  it('receives no helpful information', function () {
    expect(this.$('title').text()).to.equal('Error encountered - Find Work');
    expect(this.body).to.contain('We encountered an unexpected error');
  });

  it('renders page content', function () {
    // DEV: This verifies we aren't erroring out on render
    expect(this.$('a[href="/settings"]').length).to.be.at.least(1);
  });

  it('reports the error to Sentry', function () {
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(1);
  });
});

describe('A request for a page with a render error', function () {
  // Start our server, spy on Sentry, silence Winston, force a render error, and make our request
  serverUtils.run();
  sinonUtils.spy(app.sentryClient, 'captureError');
  sinonUtils.stub(app.notWinston, 'error');
  sinonUtils.stub(Response, 'render', function forceRenderError () {
    throw new Error('Stubbed error while rendering');
  });
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/_dev/500'),
    expectedStatusCode: 500
  });

  it('receives a 500 response', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });

  it('receives no helpful information', function () {
    expect(this.res.headers).to.have.property('content-type', 'text/plain; charset=utf-8');
    expect(this.body).to.contain('We encountered an unexpected error');
  });

  it('doesn\'t render page content', function () {
    // DEV: This verifies we are erroring out on render
    expect(this.$('a[href="/settings"]').length).to.equal(0);
  });

  it('reports the rendering error to Sentry', function () {
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(2);
  });
});
