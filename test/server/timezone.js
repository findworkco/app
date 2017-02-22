// Load in our dependencies
var expect = require('chai').expect;
var expressRequest = require('express/lib/request');
var dbFixtures = require('./utils/db-fixtures');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario('An HTTP request from a logged out user with an unrecognizable IP', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init()
    .save(serverUtils.getUrl('/add-application/save-for-later'));

  it('defaults timezone to San Francisco', function () {
    expect(this.$('select[name=saved_for_later_reminder_timezone]').val())
      .to.equal('US-America/Los_Angeles');
  });
});

scenario('An HTTP request from a logged out user with an recognizable IP', {
  dbFixtures: null
}, function () {
  // Mock our IP address and make our request
  // https://www.proxynova.com/proxy-server-list/country-jp/
  // https://github.com/expressjs/express/blob/4.14.1/lib/request.js#L329-L342
  sinonUtils.stub(expressRequest, 'ip', {
    get: function () { return '122.212.129.9'; }
  });
  httpUtils.session.init()
    .save(serverUtils.getUrl('/add-application/save-for-later'));

  it('resolves timezone from IP address', function () {
    expect(this.$('select[name=saved_for_later_reminder_timezone]').val())
      .to.equal('JP-Asia/Tokyo');
  });
});

scenario('An HTTP request from a logged in user', {
  dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
}, function () {
  // Login and make our request
  httpUtils.session.init().login()
    .save(serverUtils.getUrl('/add-application/save-for-later'));

  it('uses their saved timezone', function () {
    expect(this.$('select[name=saved_for_later_reminder_timezone]').val())
      .to.equal('US-America/Chicago');
  });
});
