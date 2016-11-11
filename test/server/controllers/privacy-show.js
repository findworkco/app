// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to GET /privacy', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/privacy'), expectedStatusCode: 200});

  it('recieves the privacy page', function () {
    expect(this.$('title').text()).to.equal('Privacy policy - Find Work');
    expect(this.body).to.contain('TODO: Add Privacy policy');
  });
});
