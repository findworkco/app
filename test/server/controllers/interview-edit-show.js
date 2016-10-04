// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /interview/:id from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  var interviewId = 'abcdef-sky-networks-interview-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/interview/' + interviewId));

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  it('recieves the interview page', function () {
    expect(this.$('.content__heading').text()).to.equal('Interview');
    expect(this.$('.content__subheading').text()).to.contain('Engineer II at Sky Networks');
  });

  it('receives the proper title', function () {
    // DEV: We have title testing as we cannot test it in visual tests
    expect(this.$('title').text()).to.equal('Interview - Engineer II at Sky Networks - Find Work');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });
});

describe.skip('A request to GET /interview/:id from a non-owner user', function () {
  // Start our server, log in (need to do), and make our request
  var interviewId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/interview/' + interviewId));

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to GET /interview/:id from a user that ' +
    'owns the interview yet doesn\'t own the application', function () {
  // TODO: Enforce interview must have the same owner as application via DB restrictions
  // Start our server, log in (need to do), and make our request
  var interviewId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/interview/' + interviewId));

  it('recieves an error', function () {
    // DEV: This verifies we don't leak sensitive info if something goes wrong
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(500);
  });
});

describe.skip('A request to GET /interview/:id that doesn\'t exist', function () {
  // Start our server, log in (need to do), and make our request
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/interview/does-not-exist'));

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to GET /interview/:id from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/interview/does-not-exist'),
    followRedirect: false
  });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
