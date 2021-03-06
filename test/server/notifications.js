// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('An HTTP request receiving a notification', {
  dbFixtures: null
}, function () {
  // Make our request (will be redirected to /schedule)
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/_dev/notification',
      query: {type: 'success', message: 'Hello World'}
    }),
    followRedirect: true,
    expectedStatusCode: 200
  });

  it('receives a response with a notification', function () {
    expect(this.body).to.contain('Hello World');
  });
});

scenario('A partial HTTP request receiving a notification', {
  dbFixtures: null
}, function () {
  // Make our request (will be redirected to /schedule)
  httpUtils.session.init()
    .save({
      url: serverUtils.getUrl({
        pathname: '/_dev/notification',
        query: {type: 'success', message: 'Hello World'}
      }),
      followRedirect: false,
      expectedStatusCode: 302
    })
    .save({
      url: serverUtils.getUrl('/schedule'),
      headers: {'X-Partial': '1'},
      followRedirect: false,
      expectedStatusCode: 200
    });

  it('receives no notifications', function () {
    expect(this.body).to.not.contain('Hello World');
  });
});

scenario('An HTTP request receiving a malicious notification', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init().save({
    url: serverUtils.getUrl({
      pathname: '/_dev/notification',
      query: {type: 'success', message: '<script>alert(1)</script>'}
    }),
    followRedirect: true,
    expectedStatusCode: 200
  });

  it('receives a response with an escaped notification', function () {
    expect(this.body).to.contain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
