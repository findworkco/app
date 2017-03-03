// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../../utils/sinon');

// Start our tests
scenario.route('A request to GET /archive', function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init()
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('recieves the archive page', function () {
      expect(this.$('title').text()).to.equal('Archived applications - Find Work');
    });
    it('has information in large content about how to archive', function () {
      expect(this.$('#content').text()).to.contain('click the "Archive" button on its page');
    });
  });

  scenario.nonExistent('from a logged in user with no applications', function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    // DEV: We test these again to make sure logged in/logged out users receive same treatment
    it('recieves the archive page', function () {
      expect(this.$('title').text()).to.equal('Archived applications - Find Work');
    });
    it('has information in large content about how to archive', function () {
      expect(this.$('#content').text()).to.contain('click the "Archive" button on its page');
    });
  });

  scenario.routeTest('from a logged in user with an archived application', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('lists the application', function () {
      var $application = this.$('#content .schedule-row--application');
      expect($application.text()).to.contain('Monstromart');
      // Links = [Heading, button]
      expect($application.find('a[href="/application/abcdef-monstromart-uuid"]')).to.have.length(2);
      expect($application.text()).to.contain('Monstromart');
      expect($application.text()).to.contain('Archived on: Mon Jan 18');
      expect($application.find('.schedule-notes').text()).to.contain('Sounds like a great career opportunity');
    });
  });

  scenario.routeTest('from a logged in user with an active application', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('does not list the application', function () {
      expect(this.$('#content').text()).to.contain('click the "Archive" button on its page');
      expect(this.$('#content').text()).to.not.contain('Black Mesa');
    });
  });

  scenario.nonOwner('from a logged in user with an application in another account', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('does not list the application', function () {
      expect(this.$('#content').text()).to.contain('click the "Archive" button on its page');
      expect(this.$('#content').text()).to.not.contain('Monstromart');
    });
  });

  // Edge case for sorting
  scenario.routeTest('from a logged in user with multiple archived applications', {
    dbFixtures: [
      dbFixtures.APPLICATION_ARCHIVED,
      dbFixtures.APPLICATION_ARCHIVED_2,
      dbFixtures.DEFAULT_FIXTURES
    ]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login();
    sinonUtils.spy(Array.prototype, 'sort');
    httpUtils.session.save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('lists the applications, ordered by time (closest first)', function () {
      // Assert our text
      var $applications = this.$('#content .schedule-row--application');
      expect($applications).to.have.length(2);
      expect($applications.eq(0).text()).to.contain('Aperature Science');
      expect($applications.eq(0).text()).to.contain('Archived on: Tue Mar 22');
      expect($applications.eq(1).text()).to.contain('Monstromart');
      expect($applications.eq(1).text()).to.contain('Archived on: Mon Jan 18');

      // DEV: This acts as a sanity check for using `sort`, we can't do much better (e.g. force random order)
      var sortSpy = Array.prototype.sort;
      var sortApplicationsByTimeArgs = sortSpy.args.filter(function (fnArgs) {
        var comparator = fnArgs[0];
        return comparator && comparator.name === 'sortApplicationsByTime';
      });
      expect(sortApplicationsByTimeArgs.length).to.equal(1);
    });
  });

  // Edge case for alternative text
  scenario.routeTest('from a logged in user with applications with no notes', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED_EMPTY, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('renders applications with no notes text', function () {
      var $application = this.$('#content .schedule-row--application');
      expect($application.find('.schedule-notes').html()).to.contain('<i>No notes recorded</i>');
    });
  });
});
