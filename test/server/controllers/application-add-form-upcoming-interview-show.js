// Load in our dependencies
var expect = require('chai').expect;
var extractValues = require('extract-values');
var dateUtils = require('../utils/date');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /add-application/upcoming-interview (specific)', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init()
      .save({url: serverUtils.getUrl('/add-application/upcoming-interview'), expectedStatusCode: 200});

    it('recieves the expected page variant', function () {
      expect(this.$('title').text()).to.contain('Add job application - Upcoming interview');
    });

    it('has expected application status', function () {
      expect(this.$('#application-status').text()).to.equal('Status: Upcoming interview');
    });

    it.skip('has expected specific fields', function () {
      // Application date, interview details
      expect(this.$('input[name=application_date]').length).to.equal(1);
    });

    it('sets application date to today', function () {
      // DEV: Our visual tests override this value for consistency in screenshots
      // DEV: We construct values without moment to verify our logic is correct
      // Example date string: 2016-05-23T21:00:00.000Z
      var expectedDateStr = new Date(dateUtils.nowInUTC()).toISOString();
      var expectedInfo = extractValues(expectedDateStr, '{date}T{full_time}');
      expect(this.$('input[name=application_date]').val()).to.equal(expectedInfo.date);
    });

    it('sets interview date/time to 1 week from now', function () {
      var expectedDate = dateUtils.startOfHour(dateUtils.nowInChicago() + dateUtils.oneWeek() + dateUtils.oneHour());
      var expectedDateStr = new Date(expectedDate).toISOString();
      var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
      expect(this.$('input[name=date_time_date]').val()).to.equal(expectedInfo.date);
      expect(this.$('input[name=date_time_time]').val()).to.equal(expectedInfo.time);
      expect(this.$('select[name=date_time_timezone]').val()).to.equal('US-America/Chicago');
    });

    it('sets pre-interview reminder to 2 hours before interview', function () {
      var expectedDate = dateUtils.startOfHour(dateUtils.nowInChicago() + dateUtils.oneWeek() + dateUtils.oneHour() -
        dateUtils.twoHours());
      var expectedDateStr = new Date(expectedDate).toISOString();
      var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
      expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal(expectedInfo.date);
      expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal(expectedInfo.time);
      expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
    });

    it('sets post-interview reminder to 2 hours after interview', function () {
      var expectedDate = dateUtils.startOfHour(dateUtils.nowInChicago() + dateUtils.oneWeek() + dateUtils.oneHour() +
        dateUtils.twoHours());
      var expectedDateStr = new Date(expectedDate).toISOString();
      var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
      expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal(expectedInfo.date);
      expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal(expectedInfo.time);
      expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
    });
  });
});
