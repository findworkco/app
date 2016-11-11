// Load in our dependencies
var expect = require('chai').expect;
var extractValues = require('extract-values');
var dateUtils = require('../utils/date');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to GET /application/:id/add-interview from the owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/application/' + applicationId + '/add-interview'),
    expectedStatusCode: 200
  });

  it('recieves the interview add page', function () {
    expect(this.$('.content__heading').text()).to.equal('Add interview');
    expect(this.$('.content__subheading').text()).to.contain('Sky Networks');
  });

  it('receives the proper title', function () {
    // DEV: We have title testing as we cannot test it in visual tests
    expect(this.$('title').text()).to.equal('Add interview - Sky Networks - Find Work');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });

  it('set our default date/time to tomorrow', function () {
    // Prepare our date (including timezone offset for Chicago)
    // DEV: Our visual tests override this value for consistency in screenshots
    // DEV: We construct values without moment to verify our logic is correct
    var expectedDateVal = dateUtils.nowInChicago() + dateUtils.oneHour() + dateUtils.oneWeek();
    expectedDateVal = dateUtils.startOfHour(expectedDateVal);

    // Extract and compare our values
    // 2016-05-23T21:00:00.000Z
    var expectedDateStr = new Date(expectedDateVal).toISOString();
    var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=date_time_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=date_time_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=date_time_timezone]').val()).to.equal('US-America/Chicago');
    expectedDateStr = new Date(expectedDateVal - dateUtils.twoHours()).toISOString();
    expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
    expectedDateStr = new Date(expectedDateVal + dateUtils.twoHours()).toISOString();
    expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
  });
});

scenario.skip('A request to GET /application/:id/add-interview from a non-owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-uuid';
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/application/' + applicationId + '/add-interview'),
    expectedStatusCode: 404
  });

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to GET /application/:id/add-interview for an application that doesn\'t exist', function () {
  // Log in (need to do) and make our request
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
    expectedStatusCode: 404
  });

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to GET /application/:id/add-interview from a logged out user', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
    followRedirect: false,
    expectedStatusCode: 302
  });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
