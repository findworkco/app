// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /interview/:id', function () {
  var skyNetworksDbFixture = dbFixtures.APPLICATION_SKY_NETWORKS;
  var skyNetworksInterviewUrl = '/interview/abcdef-sky-networks-interview-uuid';
  scenario.routeTest('from the owner user', {
    dbFixtures: [skyNetworksDbFixture, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in (need to do) and make our request
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl(skyNetworksInterviewUrl),
      expectedStatusCode: 200
    });

    it('recieves the interview page', function () {
      expect(this.$('.content__heading').text()).to.equal('Interview');
      expect(this.$('.content__subheading').text()).to.contain('Sky Networks');
    });

    it('receives the proper title', function () {
      // DEV: We have title testing as we cannot test it in visual tests
      expect(this.$('title').text()).to.equal('Interview - Sky Networks - Find Work');
    });

    it('shows its application as recently viewed in navigation', function () {
      expect(this.$('.nav-row--selected.nav-row--application')).to.have.length(1);
      expect(this.$('.nav-row--selected.nav-row--application').text()).to.contain('Sky Networks');
    });

    it('has our expected fields', function () {
      expect(this.$('input[name=date_time_date]').val()).to.equal('2016-01-15');
      expect(this.$('input[name=date_time_time]').val()).to.equal('09:00');
      expect(this.$('select[name=date_time_timezone]').val()).to.equal('US-America/Los_Angeles');

      expect(this.$('input[name=details]').val()).to.equal('Call 555-123-4567');

      expect(this.$('input[name=pre_interview_reminder_date]').val()).to.equal('2016-01-15');
      expect(this.$('input[name=pre_interview_reminder_time]').val()).to.equal('08:00');
      expect(this.$('select[name=pre_interview_reminder_timezone]').val()).to.equal('US-America/Los_Angeles');

      expect(this.$('input[name=post_interview_reminder_date]').val()).to.equal('2016-01-15');
      expect(this.$('input[name=post_interview_reminder_time]').val()).to.equal('11:00');
      expect(this.$('select[name=post_interview_reminder_timezone]').val()).to.equal('US-America/Los_Angeles');
    });

    it('links back to job application', function () {
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
        url: serverUtils.getUrl(skyNetworksInterviewUrl),
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl('/interview/does-not-exist'),
      expectedStatusCode: 404
    });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/interview/does-not-exist'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
