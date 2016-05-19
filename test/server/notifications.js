// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
describe('An HTTP request receiving a notification', function () {
  // Start our server and make our request (will be redirected to /schedule)
  serverUtils.run();
  httpUtils.session.init().save({
    followRedirect: true,
    url: serverUtils.getUrl({
      pathname: '/_dev/notification',
      query: {type: 'success', message: 'Hello World'}
    })
  });

  it('receives a response with a notification', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    expect(this.body).to.contain('Hello World');
  });
});

describe('An HTTP request receiving a malicious notification', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    followRedirect: true,
    url: serverUtils.getUrl({
      pathname: '/_dev/notification',
      query: {type: 'success', message: '<script>alert(1)</script>'}
    })
  });

  it('receives a response with an escaped notification', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    expect(this.body).to.contain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
