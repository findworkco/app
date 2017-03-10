// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('./utils/db-fixtures');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('An HTTP request to an analytics serving server', {
  dbFixtures: null,
  serveAnalytics: true
}, function () {
  // Make our request
  httpUtils.save({url: serverUtils.getUrl('/'), expectedStatusCode: 200});

  it('receives a response with analytics', function () {
    expect(this.body).to.contain('i,s,o,g,r,a,m');
  });
});

scenario('An analytics direct evented request', {
  dbFixtures: null,
  serveAnalytics: true,
  glassdoorFixtures: ['/api/api.htm#full']
}, function () {
  // Make our request
  httpUtils.session.init()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: {company_name: 'Mock company'},
      followRedirect: false, expectedStatusCode: 200
    });

  it('receives an analytics event', function () {
    expect(this.body).to.contain(
      'ga(\'send\', \'event\', "Research company", "search", "Mock company");');
  });
});

scenario('An analytics indirect evented request', {
  dbFixtures: [dbFixtures.DEFAULT_FIXTURES],
  serveAnalytics: true
}, function () {
  // Make our request
  httpUtils.session.init().login();

  it('receives an analytics event', function () {
    expect(this.body).to.contain(
      'ga(\'send\', \'event\', "Log in", "google");');
    // Sanity check we don't leak to notifications
    expect(this.$('#notification-content').html())
      .to.equal('<div data-notification="success">Welcome back to Find Work!</div>');
  });
});

scenario('A malicious analytics evented request', {
  dbFixtures: null,
  serveAnalytics: true,
  glassdoorFixtures: ['/api/api.htm#full']
}, function () {
  // Make our request
  httpUtils.session.init()
    .save(serverUtils.getUrl('/research-company'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/research-company'),
      htmlForm: {company_name: '\'"</script><script>alert(1);</script>'},
      followRedirect: false, expectedStatusCode: 200
    });

  it('responds with escaped event', function () {
    // jscs:disable maximumLineLength
    expect(this.body).to.contain(
      'ga(\'send\', \'event\', "Research company", "search", "\'\\"\\u003C\\u002Fscript\\u003E\\u003Cscript\\u003Ealert(1);\\u003C\\u002Fscript\\u003E");');
    // jscs:enable maximumLineLength
  });
});
