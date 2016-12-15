// Load in our dependencies
var expect = require('chai').expect;
var applicationMockData = require('../../server/models/application-mock-data');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var sinonUtils = require('./utils/sinon');

// Start our tests
scenario('A request to a page from a logged out user', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('receives Sign up and Log in links in the nav sidebar', function () {
    expect(this.$('#nav a[href="/sign-up"]')).to.have.length(1);
    expect(this.$('#nav a[href="/login"]')).to.have.length(1);
    // DEV: As a sanity check, we verify all content (not only nav) lacks placeholder text
    expect(this.$('body').text()).to.not.contain('@findwork.co');
  });

  it('receives Sign up and Log in links in the nav topbar', function () {
    expect(this.$('#topbar a[href="/sign-up"]')).to.have.length(1);
    expect(this.$('#topbar a[href="/login"]')).to.have.length(1);
    expect(this.$('#topbar a[href="/settings"]')).to.have.length(0);
  });

  it('has no logout button', function () {
    expect(this.$('#nav form[action="/logout"]')).to.have.length(0);
  });
});

scenario('A request to a page from a logged in user', function () {
  // Make our request
  httpUtils.session.init().login()
    .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('receives candidate email in the nav sidebar', function () {
    expect(this.$('#nav a[href="/settings"]')).to.have.length(2);
    expect(this.$('#nav a[href="/settings"]').text())
      .to.contain('mock-email@mock-domain.test');
    expect(this.$('#nav a[href="/sign-up"]')).to.have.length(0);
    expect(this.$('#nav a[href="/login"]')).to.have.length(0);
  });

  it('receives avatar with settings link in the nav topbar', function () {
    expect(this.$('#topbar a[href="/sign-up"]')).to.have.length(0);
    expect(this.$('#topbar a[href="/login"]')).to.have.length(0);
    expect(this.$('#topbar a[href="/settings"]')).to.have.length(1);
  });

  it('has a logout button', function () {
    expect(this.$('#nav form[action="/logout"]')).to.have.length(1);
  });
});

scenario.route('A request to a page which loads navigation', function () {
  scenario.routeTest('from a logged in user with applications', function () {
    // Log in our user, spy on our database connection, and make our request
    // DEV: We login first to avoid counting it hitting nav as we login
    httpUtils.session.init().login();
    sinonUtils.spy(applicationMockData, 'getById');
    // DEV: We use 404 to isolate navigation only requests
    httpUtils.session.save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('resolves applications from database', function () {
      var getByIdSpy = applicationMockData.getById;
      expect(getByIdSpy.callCount).to.equal(3);
    });

    it('notifies user about their applications', function () {
      expect(this.$('#nav').text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.nonExistent.skip('from a logged in user with no applications', function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('notifies user about no applications', function () {
      // TODO: Complete me
    });
  });

  scenario.nonOwner.skip('from a logged in user with an application in another account', function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it.skip('does not list the application', function () {
      // Test me
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Spy on our database connection and make our request
    sinonUtils.spy(applicationMockData, 'getById');
    httpUtils.session.init()
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('doesn\'t load any models', function () {
      var getByIdSpy = applicationMockData.getById;
      expect(getByIdSpy.callCount).to.equal(0);
    });

    // DEV: We are skipping these for now to allow prototyping flexibility
    it.skip('notifies user about no applications', function () {
      // TODO: Complete me
    });
  });
});

scenario.route('A request to a page which doesn\'t load navigation', {
  // DEV: We can't test `loggedOut` without creating a development route as `nav: false` is for save actions
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from a logged in user with applications', function () {
    // Log in our user, spy on our database connection, and make our request
    // DEV: We login and load page first to avoid counting it hitting nav as we login
    // TODO: Complete form for test
    var interviewId = 'abcdef-sky-networks-interview-uuid';
    httpUtils.session.init().login().save(serverUtils.getUrl('/interview/' + interviewId));
    sinonUtils.spy(applicationMockData, 'getById');
    // DEV: We use interview page to isolate navigation only requests (i.e. applications)
    httpUtils.session.save({
      method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId + '/delete'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('doesn\'t load any models', function () {
      var getByIdSpy = applicationMockData.getById;
      expect(getByIdSpy.callCount).to.equal(0);
    });
  });
});
