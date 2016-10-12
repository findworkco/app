// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('An HTTP request that touches PostgreSQL', function () {
  // Make our request
  httpUtils.save({url: serverUtils.getUrl('/_dev/postgresql'), expectedStatusCode: 200});

  it('receives a successful response', function () {
    expect(this.body).to.equal('Sum: 2');
  });
});
