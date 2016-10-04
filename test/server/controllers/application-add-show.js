// Load in our dependencies
var expect = require('chai').expect;
var extractValues = require('extract-values');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to GET /add-application', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/add-application'), expectedStatusCode: 200});

  it('recieves the add application page', function () {
    expect(this.$('.content__heading').text()).to.equal('Add job application');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });

  it('sets status to "Have not applied" by default', function () {
    expect(this.$('input[name=status]:checked').val()).to.equal('have_not_applied');
  });

  it('sets application reminder to 1 week from now', function () {
    // Prepare our date (including timezone offset for Chicago)
    // DEV: Our visual tests override this value for consistency in screenshots
    // DEV: We construct values without moment to verify our logic is correct
    var expectedDateVal = Date.now() + (1000 * 60 * 60 * 24 * 7) + (1000 * 60 * 60) - (1000 * 60 * 60 * 5);
    expectedDateVal = expectedDateVal - (expectedDateVal % (1000 * 60 * 60));

    // Extract and compare our values
    // 2016-05-23T21:00:00.000Z
    var expectedDateStr = new Date(expectedDateVal).toISOString();
    var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=application_reminder_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=application_reminder_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=application_reminder_timezone]').val()).to.equal('US-America/Chicago');
  });
});
