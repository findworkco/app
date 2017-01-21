// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /interview/:id', function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_SKY_NETWORKS, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in (need to do) and make our request
    var interviewId = 'abcdef-sky-networks-interview-uuid';
    httpUtils.session.init().login().save({
      url: serverUtils.getUrl('/interview/' + interviewId),
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

    // Test that all fields exist
    it.skip('has our expected fields', function () {
      expect(this.$('input[name=...]').val()).to.equal('Test me');
    });
  });

  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [dbFixtures.APPLICATION_SKY_NETWORKS, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    var interviewId = 'abcdef-sky-networks-interview-uuid';
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        url: serverUtils.getUrl('/interview/' + interviewId),
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.routeTest.skip('from a user that owns the interview yet doesn\'t own the application', function () {
    // TODO: Enforce interview must have the same owner as application via DB restrictions
    // Log in (need to do) and make our request
    var interviewId = 'abcdef-uuid';
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/interview/' + interviewId),
      expectedStatusCode: 500
    });

    it('recieves an error', function () {
      // DEV: This verifies we don't leak sensitive info if something goes wrong
      // TODO: Assert error somehow
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
