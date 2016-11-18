// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /schedule', function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('recieves the schedule page', function () {
      expect(this.$('title').text()).to.equal('Schedule - Find Work');
    });
    it('has calls to action in nav for creating a new application or performing research', function () {
      expect(this.$('#nav__upcoming-interviews a').eq(0).text()).to.equal('Add a job application');
      expect(this.$('#nav__upcoming-interviews a').eq(1).text()).to.equal('research a company');
      expect(this.$('#nav__waiting-for-response a').eq(0).text()).to.equal('Add a job application');
      expect(this.$('#nav__waiting-for-response a').eq(1).text()).to.equal('research a company');
    });
    it('has calls to action in large content for creating a new application or performing research', function () {
      expect(this.$('#content a').eq(0).text()).to.equal('+ Add a job application');
      expect(this.$('#content a').eq(1).text()).to.equal('Research a company');
    });
  });

  scenario.nonExistent.skip('from a logged in user with no applications', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    // DEV: We test these again to make sure logged in/logged out users receive same treatment
    it('recieves the schedule page', function () {
      expect(this.$('title').text()).to.equal('Schedule - Find Work');
    });
    it.skip('has a call to action for creating a new application', function () {
      // Test me
    });

    it.skip('does not show an offers received section', function () {
      // Test me
    });

    it.skip('does not show a "Have not applied" section', function () {
      // Test me
    });
  });

  // DEV: We are skipping these for now to allow prototyping flexibility
  scenario.routeTest.skip('from a logged in user with active applications', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('has selection prompt in center of content', function () {
      // Test me
    });
  });

  // DEV: We are skipping these for now to allow prototyping flexibility
  scenario.routeTest.skip('from a logged in user with ' +
      'active applications but no upcoming interviews', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('has no call to action in upcoming interviews', function () {
      // DEV: We assume user knows how to use UI now
      // Test me
    });
  });

  // DEV: We are skipping these for now to allow prototyping flexibility
  scenario.routeTest.skip('from a logged in user with ' +
      'active applications but no waiting for response applications', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('has no call to action in waiting for response applications', function () {
      // DEV: We assume user knows how to use UI now
      // Test me
    });
  });

  scenario.routeTest.skip('from a logged in user with an offer received application', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('lists the application', function () {
      // Test me
    });
  });

  // DEV: We are skipping these for now to allow prototyping flexibility
  scenario.routeTest.skip('from a logged in user with an upcoming interview application', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists the application', function () {
      // TODO: Remove `:first-child`, it's a legacy from prototyping
      expect(this.$('#nav #nav__upcoming-interviews .nav-row--application:first-child h4').text())
        .to.equal('Umbrella Corporation');
    });
  });

  // DEV: We are skipping these for now to allow prototyping flexibility
  scenario.routeTest.skip('from a logged in user with a waiting for response application', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists the application', function () {
      expect(this.$('#nav #nav__waiting-for-response .nav-row--application h4').text())
        .to.equal('Sky Networks');
    });
  });

  scenario.routeTest.skip('from a logged in user with a have not applied application', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('lists the application', function () {
      // Test me
    });
  });

  scenario.nonOwner.skip('from a logged in user with an application in another account', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('does not list the application', function () {
      // Test me
    });
  });

  scenario.routeTest.skip('from a logged in user with an archived application', function () {
    // Log in our user (need to add) and make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it.skip('does not list the application', function () {
      // Test me
    });
  });
});
