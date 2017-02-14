// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('./utils/db-fixtures');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('A request from a session with an admin-deleted user', {
  dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
}, function () {
  // Make a request, assert initial setup, delete candidate, and make our request
  httpUtils.session.init().login()
    .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});
  before(function sanityCheckLoggedIn () {
    expect(this.body).to.contain('mock-email@mock-domain.test');
  });
  before(function deleteCandidate (done) {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT_KEY];
    candidate.destroy({_allowNoTransaction: true, _sourceType: 'server'}).asCallback(done);
  });
  httpUtils.session.save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('doesn\'t identify deleted user', function () {
    expect(this.body).to.not.contain('mock-email@mock-domain.test');
  });
});
