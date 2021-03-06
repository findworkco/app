// Load in our dependencies
var expect = require('chai').expect;
var extractValues = require('extract-values');
var dbFixtures = require('../utils/db-fixtures');
var dateUtils = require('../utils/date');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id/add-interview', function () {
  var skyNetworksDbFixture = dbFixtures.APPLICATION_SKY_NETWORKS;
  var skyNetworksAddInterviewUrl = '/application/abcdef-sky-networks-uuid/add-interview';
  scenario.routeTest('from the owner user', {
    dbFixtures: [skyNetworksDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl(skyNetworksAddInterviewUrl),
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

    it('set our default date/time and reminders to 1 week from now', function () {
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

    it('provides link back to application', function () {
      expect(this.$('#content a[href="/application/abcdef-sky-networks-uuid"]').length)
        .to.be.at.least(1);
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [skyNetworksDbFixture, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        url: serverUtils.getUrl(skyNetworksAddInterviewUrl),
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('for an application that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
      expectedStatusCode: 404
    });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/application/does-not-exist/add-interview'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
