// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /archive', function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('recieves the archive page', function () {
      expect(this.$('title').text()).to.equal('Archived applications - Find Work');
    });
    it('has information in large content about how to archive', function () {
      expect(this.$('#content').text()).to.contain('click the "Archive" button on its page');
    });
  });

  scenario.nonExistent.skip('from a logged in user with no applications', function () {
    // Log in (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    // DEV: We test these again to make sure logged in/logged out users receive same treatment
    it('recieves the archive page', function () {
      expect(this.$('title').text()).to.equal('Archived applications - Find Work');
    });
    it('has information in large content about how to archive', function () {
      expect(this.$('#content').text()).to.contain('click the "Archive" button on its page');
    });
  });

  // DEV: We are skipping these for now to allow prototyping flexibility
  scenario.routeTest.skip('from a logged in user with an archived application', function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it('lists the application', function () {
      // TODO: Remove `:first-child`, it's a legacy from prototyping
      expect(this.$('#nav #nav__archived .nav-row--application:first-child h4').text())
        .to.equal('Monstromart');
    });
  });

  scenario.nonOwner.skip('from a logged in user with an application in another account', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it.skip('does not list the application', function () {
      // Test me
    });
  });

  scenario.routeTest.skip('from a logged in user with an active application', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/archive'), expectedStatusCode: 200});

    it.skip('does not list the application', function () {
      // Test me
    });
  });
});
