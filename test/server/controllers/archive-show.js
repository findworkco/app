// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

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
      expect(this.$('#content .schedule-row--application').text()).to.contain('Monstromart');
      expect(this.$('#content .schedule-row--application a').attr('href'))
        .to.equal('/application/abcdef-monstromart-uuid');
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
});
