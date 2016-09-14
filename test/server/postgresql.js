// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
describe('An HTTP request that touches PostgreSQL', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.save(serverUtils.getUrl('/_dev/postgresql'));

  it('receives a successful response', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    expect(this.body).to.equal('Sum: 2');
  });
});
