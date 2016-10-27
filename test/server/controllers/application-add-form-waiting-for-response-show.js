// Load in our dependencies
var expect = require('chai').expect;
var extractValues = require('extract-values');
var dateUtils = require('../utils/date');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to GET /add-application/waiting-for-response (specific)', function () {
  // Make our request
  httpUtils.session.init()
    .save({url: serverUtils.getUrl('/add-application/waiting-for-response'), expectedStatusCode: 200});

  it('recieves the expected page variant', function () {
    expect(this.$('title').text()).to.contain('Add job application - Waiting for response');
  });

  it('has expected application status', function () {
    expect(this.$('#application-status').text()).to.equal('Status: Waiting for response');
  });

  it('has expected specific fields', function () {
    // DEV: This is redundant to application date checker but consistent with other tests
    expect(this.$('input[name=application_date]').length).to.equal(1);
  });

  it('sets application date to today', function () {
    // DEV: Our visual tests override this value for consistency in screenshots
    // DEV: We construct values without moment to verify our logic is correct
    // Example date string: 2016-05-23T21:00:00.000Z
    var expectedDateStr = new Date(dateUtils.nowInChicago()).toISOString();
    var expectedInfo = extractValues(expectedDateStr, '{date}T{full_time}');
    expect(this.$('input[name=application_date]').val()).to.equal(expectedInfo.date);
  });

  it('sets follow up reminder to 1 week from now', function () {
    var expectedDate = dateUtils.startOfHour(dateUtils.nowInChicago() + dateUtils.oneWeek() + dateUtils.oneHour());
    var expectedDateStr = new Date(expectedDate).toISOString();
    var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=follow_up_reminder_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=follow_up_reminder_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=follow_up_reminder_timezone]').val()).to.equal('US-America/Chicago');
  });
});
