// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
describe('An HTTP request to a running server', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.save(serverUtils.getUrl('/'));

  it('receives a response', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });
});
