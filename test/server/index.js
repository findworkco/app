// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('An HTTP request to a running server', function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/'), expectedStatusCode: 200});

  it('receives a response', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });

  it('receives a session cookie', function () {
    // toJSON() = {version: 'tough-cookie@2.2.2', storeType: 'MemoryCookieStore', rejectPublicSuffixes: true,
    // cookies: [{key: 'sid', value: 's%3A....', expires: '2016-05-31T23:41:05.000Z',
    //   domain: 'localhost', path: '/', httpOnly: true, hostOnly: true, creation, lastAccessed}]}
    var cookies = this.jar._jar.toJSON().cookies;
    expect(cookies).to.have.length(1);
    expect(cookies[0]).to.have.property('key', 'sid');
    expect(cookies[0]).to.have.property('path', '/');
    expect(cookies[0]).to.have.property('httpOnly', true);
  });
});
