// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
describe('An HTTP request to an analytics serving server', function () {
  // Start our server and make our request
  var server = serverUtils.run();
  before(function enableAnalytics () {
    expect(server.app.locals.serveAnalytics).to.equal(false);
    server.app.locals.serveAnalytics = true;
  });
  after(function disableAnalytics () {
    server.app.locals.serveAnalytics = false;
    expect(server.app.locals.serveAnalytics).to.equal(false);
  });
  httpUtils.save(serverUtils.getUrl('/'));

  it('receives a response with analytics', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    expect(this.body).to.contain('i,s,o,g,r,a,m');
  });
});
