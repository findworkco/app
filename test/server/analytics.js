// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var app = require('./utils/server').app;

// Start our tests
scenario('An HTTP request to an analytics serving server', function () {
  // Toggle analytics and make our request
  before(function enableAnalytics () {
    expect(app.locals.serveAnalytics).to.equal(false);
    app.locals.serveAnalytics = true;
  });
  httpUtils.save({url: serverUtils.getUrl('/'), expectedStatusCode: 200});
  after(function disableAnalytics () {
    app.locals.serveAnalytics = false;
    expect(app.locals.serveAnalytics).to.equal(false);
  });

  it('receives a response with analytics', function () {
    expect(this.body).to.contain('i,s,o,g,r,a,m');
  });
});
