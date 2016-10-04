// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe.skip('A request to GET /schedule from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('recieves the schedule page', function () {
    expect(this.$('.content__heading')).to.have.length(0);
  });
  it.skip('has a call to action for creating a new application', function () {
    // Test me
  });
});

describe('A request to GET /schedule from a logged in user with no applications', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  // DEV: We test these again to make sure logged in/logged out users receive same treatment
  it('recieves the schedule page', function () {
    expect(this.$('.content__heading')).to.have.length(0);
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

describe.skip('A request to GET /schedule from a logged in user with an offer received application', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it.skip('lists the application', function () {
    // Test me
  });
});

// DEV: We are skipping these for now to allow prototyping flexibility
describe.skip('A request to GET /schedule from a logged in user with an upcoming interview application', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('lists the application', function () {
    // TODO: Remove `:first-child`, it's a legacy from prototyping
    expect(this.$('#nav #nav__upcoming-interviews .nav-row--application:first-child h4').text())
      .to.equal('Senior Software Engineer at Umbrella Corporation');
  });
});

// DEV: We are skipping these for now to allow prototyping flexibility
describe.skip('A request to GET /schedule from a logged in user with a waiting for response application', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('lists the application', function () {
    expect(this.$('#nav #nav__waiting-for-response .nav-row--application h4').text())
      .to.equal('Engineer II at Sky Networks');
  });
});

describe.skip('A request to GET /schedule from a logged in user with a have not applied application', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it.skip('lists the application', function () {
    // Test me
  });
});

describe.skip('A request to GET /schedule from a logged in user with an application in another account', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it.skip('does not list the application', function () {
    // Test me
  });
});

describe.skip('A request to GET /schedule from a logged in user with an archived application', function () {
  // Start our server, log in our user (need to add), and make our request
  serverUtils.run();
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it.skip('does not list the application', function () {
    // Test me
  });
});
