// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to /add-application', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/add-application'));

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  it('recieves the add application page', function () {
    expect(this.$('.content__heading').text()).to.equal('Add job application');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });

  it('sets status to "Have not applied" by default', function () {
    expect(this.$('input[name=status]:checked').val()).to.equal('have_not_applied');
  });

  it.skip('sets application reminder to 1 week from now', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });
});
