// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /terms', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/terms'));

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  it('recieves the terms page', function () {
    expect(this.$('title').text()).to.equal('Terms of service - Find Work');
    expect(this.body).to.contain('TODO: Add Terms of service');
  });
});
