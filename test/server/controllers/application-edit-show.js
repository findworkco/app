// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to /application/:id from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/application/' + applicationId));

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  it('recieves the application page', function () {
    expect(this.$('.content__heading').text()).to.equal('Job application');
    expect(this.$('.content__subheading').text()).to.contain('Engineer II at Sky Networks');
  });

  it('receives the proper title', function () {
    // DEV: We have title testing as we cannot test it in visual tests
    expect(this.$('title').text()).to.equal('Application - Engineer II at Sky Networks - Find Work');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });
});

describe.skip('A request to /application/:id from a non-owner user', function () {
  // Start our server, log in (need to do), and make our request
  var applicationId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/application/' + applicationId));

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to /application/:id that doesn\'t exist', function () {
  // Start our server, log in (need to do), and make our request
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/application/does-not-exist'));

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to /application/:id from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    followRedirect: false,
    url: serverUtils.getUrl('/application/does-not-exist')
  });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
