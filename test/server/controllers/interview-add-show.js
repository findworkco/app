// Load in our dependencies
var expect = require('chai').expect;
var extractValues = require('extract-values');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe.only('A request to /application/:id/add-interview from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/application/' + applicationId + '/add-interview'));

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });

  it('recieves the interview add page', function () {
    expect(this.$('.content__heading').text()).to.equal('Add interview');
    expect(this.$('.content__subheading').text()).to.contain('Engineer II at Sky Networks');
  });

  it('receives the proper title', function () {
    // DEV: We have title testing as we cannot test it in visual tests
    expect(this.$('title').text()).to.equal('Add interview - Engineer II at Sky Networks - Find Work');
  });

  // Test that all fields exist
  it.skip('has our expected fields', function () {
    expect(this.$('input[name=...]').val()).to.equal('Test me');
  });

  it('set our default date/time to tomorrow', function () {
    // Prepare our date (including timezone offset for Chicago)
    // DEV: Our visual tests override this value for consistency in screenshots
    // DEV: We construct values without moment to verify our logic is correct
    var expectedDateVal = Date.now() + (1000 * 60 * 60 * 24) + (1000 * 60 * 60) - (1000 * 60 * 60 * 5);
    expectedDateVal = expectedDateVal - (expectedDateVal % (1000 * 60 * 60));

    // Extract and compare our values
    // 2016-05-23T21:00:00.000Z
    var expectedDateStr = new Date(expectedDateVal).toISOString();
    var expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=timezone]').val()).to.equal('US-America/Chicago');
    expectedDateStr = new Date(expectedDateVal - (1000 * 60 * 60 * 2)).toISOString();
    expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
    expectedDateStr = new Date(expectedDateVal + (1000 * 60 * 60 * 2)).toISOString();
    expectedInfo = extractValues(expectedDateStr, '{date}T{time}:00.000Z');
    expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal(expectedInfo.date);
    expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal(expectedInfo.time);
    expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/Chicago');
  });
});

describe.skip('A request to /application/:id/add-interview from a non-owner user', function () {
  // Start our server, log in (need to do), and make our request
  var applicationId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/application/' + applicationId + '/add-interview'));

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to /application/:id/add-interview for an application that doesn\'t exist', function () {
  // Start our server, log in (need to do), and make our request
  serverUtils.run();
  httpUtils.session.init().save(serverUtils.getUrl('/application/does-not-exist/add-interview'));

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to /application/:id/add-interview from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({
    followRedirect: false,
    url: serverUtils.getUrl('/application/does-not-exist/add-interview')
  });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
