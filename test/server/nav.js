// Load in our dependencies
var expect = require('chai').expect;
var Promise = require('bluebird');
var app = require('./utils/server').app;
var Application = require('../../server/models/application');
var ApplicationReminder = require('../../server/models/application-reminder');
var dbFixtures = require('./utils/db-fixtures');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var sinonUtils = require('./utils/sinon');

// Start our tests
var recentlyViewedApplicationFixtures = [
  dbFixtures.APPLICATION_UMBRELLA_CORP,
  dbFixtures.APPLICATION_GLOBO_GYM,
  dbFixtures.APPLICATION_MONSTROMART,
  dbFixtures.DEFAULT_FIXTURES
];
function addRecentlyViewedApplications() {
  httpUtils.session
    .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
    .save(serverUtils.getUrl('/application/abcdef-globo-gym-uuid'))
    .save(serverUtils.getUrl('/application/abcdef-monstromart-uuid'));
}
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
  scenario.routeTest('from a logged in user with applications and has recently viewed them', {
    dbFixtures: recentlyViewedApplicationFixtures
  }, function () {
    // Log in our user, add recently viewed applications, spy on our database connection, and make our request
    // DEV: We login first to avoid counting it hitting nav as we login
    httpUtils.session.init().login();
    addRecentlyViewedApplications();
    sinonUtils.spy(Application, 'findAll');
    // DEV: We use 404 to isolate navigation only requests
    httpUtils.session.save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('resolves applications from database', function () {
      var findAllSpy = Application.findAll;
      expect(findAllSpy.callCount).to.equal(1);
    });

    it('notifies user about their applications', function () {
      expect(this.$('.nav-row--application')).to.have.length(3);
      expect(this.$('.nav-row--application').eq(0).text()).to.contain('Monstromart');
      expect(this.$('.nav-row--application').eq(1).text()).to.contain('Globo Gym');
      expect(this.$('.nav-row--application').eq(2).text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.routeTest('from a logged in user with applications and no recently viewed applications', {
    dbFixtures: recentlyViewedApplicationFixtures
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('notifies user about no applications', function () {
      expect(this.$('#nav').text()).to.contain('No applications have been recently viewed');
    });
  });

  scenario.routeTest('from a logged in user with no applications', function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('notifies user about no applications', function () {
      expect(this.$('#nav').text()).to.contain('No applications have been recently viewed');
    });
  });

  scenario.nonOwner('from a logged in user with an application in another account', {
    // DEV: We are intentionally using a simple appliation for easier updating
    dbFixtures: [dbFixtures.APPLICATION_INTERTRODE, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in as default user, verify we list application in nav,
    //   update application's owner, verify application not listed
    // DEV: We manually edit database as there's not really any way to force a candidate id into someone else's session
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_DEFAULT)
      .save({url: serverUtils.getUrl('/application/abcdef-intertrode-uuid'), expectedStatusCode: 200})
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});
    before(function verifyApplicationInNav () {
      expect(this.$('#nav').text()).to.contain('Intertrode');
    });
    before(function changeApplicationOwner (done) {
      // https://github.com/sequelize/sequelize/blob/v3.29.0/lib/model.js#L1740-L1748
      var application = Application.build({id: 'abcdef-intertrode-uuid'}, {isNewRecord: false});
      var reminder = ApplicationReminder.build({id: 'abcdef-intertrode-reminder-uuid'}, {isNewRecord: false});
      Application.sequelize.transaction(function handleTransaction (t) {
        var updateOptions = {transaction: t, _sourceType: 'server', validate: false};
        return Promise.all([
          application.update({candidate_id: 'alt00000-0000-0000-0000-000000000000'}, updateOptions),
          reminder.update({candidate_id: 'alt00000-0000-0000-0000-000000000000'}, updateOptions)
        ]);
      }).asCallback(done);
    });
    httpUtils.session
        .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('does not list the application', function () {
      expect(this.$('#nav').text()).to.not.contain('Intertrode');
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Spy on our database connection and make our request
    sinonUtils.spy(Application, 'findAll');
    httpUtils.session.init()
      .save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('doesn\'t load any models', function () {
      var findAllSpy = Application.findAll;
      expect(findAllSpy.callCount).to.equal(0);
    });

    it('notifies user about no applications', function () {
      expect(this.$('#nav').text()).to.contain('No applications have been recently viewed');
    });
  });

  // DEV: We test application associations in specific controllers (e.g. `/application/:id`, `/interview/:id`)
  //   This is more of the selection itself
  scenario.routeTest('with an associated application', {
    dbFixtures: [dbFixtures.APPLICATION_UMBRELLA_CORP, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Login, view an application, and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'), expectedStatusCode: 200});

    it('doesn\'t select a recently viewed application', function () {
      expect(this.$('.nav-row--selected.nav-row--application')).to.have.length(1);
      expect(this.$('.nav-row--selected.nav-row--application').text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.routeTest('without an associated application', {
    dbFixtures: [dbFixtures.APPLICATION_UMBRELLA_CORP, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Login, view an application, and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('doesn\'t select a recently viewed application', function () {
      expect(this.$('.nav-row--selected.nav-row--application')).to.have.length(0);
    });
  });

  // Edge case tests
  scenario.routeTest('with multiple recently viewed applications', {
    dbFixtures: [dbFixtures.APPLICATION_UMBRELLA_CORP, dbFixtures.APPLICATION_GLOBO_GYM,
      dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Login, view applications, and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
      .save({url: serverUtils.getUrl('/application/abcdef-globo-gym-uuid'), expectedStatusCode: 200});

    it('lists current application as most recently viewed', function () {
      expect(this.$('.nav-row--application')).to.have.length(2);
      expect(this.$('.nav-row--application').eq(0).text()).to.contain('Globo Gym');
      expect(this.$('.nav-row--application').eq(1).text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.nonExistent('with a recently viewed yet deleted application', {
    dbFixtures: [dbFixtures.APPLICATION_UMBRELLA_CORP, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Login, verify URL is accurate, delete our application, and make our request
    var applicationUrl = '/application/abcdef-umbrella-corp-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl(applicationUrl), expectedStatusCode: 200});
    before(function deleteApplication (done) {
      var application = this.models[dbFixtures.APPLICATION_UMBRELLA_CORP_KEY];
      application.destroy({_allowNoTransaction: true, _sourceType: 'server'}).asCallback(done);
    });
    httpUtils.session.save({url: serverUtils.getUrl(applicationUrl), expectedStatusCode: 404});

    it('doesn\'t list deleted application as a recently viewed application', function () {
      expect(this.$('.nav-row--application')).to.have.length(0);
    });
  });

  scenario.routeTest('with more than 3 recently viewed applications', {
    dbFixtures: [
      dbFixtures.APPLICATION_UMBRELLA_CORP, dbFixtures.APPLICATION_GLOBO_GYM,
      dbFixtures.APPLICATION_MONSTROMART, dbFixtures.APPLICATION_BLACK_MESA,
      dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Login, view our applications, and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
      .save(serverUtils.getUrl('/application/abcdef-globo-gym-uuid'))
      .save(serverUtils.getUrl('/application/abcdef-monstromart-uuid'))
      .save({url: serverUtils.getUrl('/application/abcdef-black-mesa-uuid'), expectedStatusCode: 200});

    it('lists 3 most recent applications', function () {
      expect(this.$('.nav-row--application')).to.have.length(3);
      expect(this.$('.nav-row--application').eq(0).text()).to.contain('Black Mesa');
      expect(this.$('.nav-row--application').eq(1).text()).to.contain('Monstromart');
      expect(this.$('.nav-row--application').eq(2).text()).to.contain('Globo Gym');
      expect(this.$('.nav-row--application').text()).to.not.contain('Umbrella Corporation');
    });
  });

  scenario.routeTest('viewing an already recently viewed application', {
    dbFixtures: [
      dbFixtures.APPLICATION_UMBRELLA_CORP, dbFixtures.APPLICATION_GLOBO_GYM,
      dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Login, view our applications, and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
      .save(serverUtils.getUrl('/application/abcdef-globo-gym-uuid'))
      .save({url: serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'), expectedStatusCode: 200});

    it('lists recently viewed application once', function () {
      expect(this.$('.nav-row--application')).to.have.length(2);
      expect(this.$('.nav-row--application').eq(0).text()).to.contain('Umbrella Corporation');
      expect(this.$('.nav-row--application').eq(1).text()).to.contain('Globo Gym');
    });
  });

  scenario.routeTest('accessing a non-existent page', {
    dbFixtures: recentlyViewedApplicationFixtures
  }, function () {
    // Log in our user, add recently viewed applications, and make our request
    httpUtils.session.init().login();
    addRecentlyViewedApplications();
    httpUtils.session.save({url: serverUtils.getUrl('/404'), expectedStatusCode: 404});

    it('loads recently viewed applications if available', function () {
      expect(this.$('.nav-row--application')).to.have.length(3);
      expect(this.$('.nav-row--application').text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.routeTest('accessing an error-prone page', {
    dbFixtures: recentlyViewedApplicationFixtures
  }, function () {
    // Silence Winston, log in our user, add recently viewed applications, and make our request
    sinonUtils.stub(app.notWinston, 'error');
    httpUtils.session.init().login();
    addRecentlyViewedApplications();
    httpUtils.session.save({url: serverUtils.getUrl('/_dev/500'), expectedStatusCode: 500});

    it('tolerate recently viewed applications not being available', function () {
      // Verify non-application nav content is present
      expect(this.$('#nav').text()).to.contain('Schedule');
    });
  });

  // Application variants
  scenario.routeTest('from a logged in user with a received offer application', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-black-mesa-uuid'), expectedStatusCode: 200});

    it('lists application-specific content in the nav', function () {
      var $navApplication = this.$('.nav-row--application');
      expect($navApplication).to.have.length(1);
      expect($navApplication.find('a[href="/application/abcdef-black-mesa-uuid"]')).to.have.length(1);
      expect($navApplication.text()).to.contain('Black Mesa');
      expect($navApplication.text()).to.contain('Status: Received offer');
      expect($navApplication.text()).to.contain('Last contact: Mon Dec 14');
      expect($navApplication.text()).to.contain('Respond by: Fri Jan 1');
    });
  });

  scenario.routeTest('from a logged in user with an upcoming interview application', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'), expectedStatusCode: 200});

    it('lists application-specific content in the nav', function () {
      var $navApplication = this.$('.nav-row--application');
      expect($navApplication).to.have.length(1);
      expect($navApplication.find('a[href="/application/abcdef-umbrella-corp-uuid"]')).to.have.length(1);
      expect($navApplication.text()).to.contain('Umbrella Corporation');
      expect($navApplication.text()).to.contain('Status: Upcoming interview');
      expect($navApplication.find('a[href="/interview/abcdef-umbrella-corp-interview-uuid"]')).to.have.length(1);
      expect($navApplication.text()).to.contain('Thu Jan 20');
      expect($navApplication.text()).to.contain('Go to 1200 Lake St');
    });
  });

  scenario.routeTest('from a logged in user with a waiting for response application', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid'), expectedStatusCode: 200});

    it('lists application-specific content in the nav', function () {
      var $navApplication = this.$('.nav-row--application');
      expect($navApplication).to.have.length(1);
      expect($navApplication.find('a[href="/application/abcdef-sky-networks-uuid"]')).to.have.length(1);
      expect($navApplication.text()).to.contain('Sky Networks');
      expect($navApplication.text()).to.contain('Status: Waiting for response');
      expect($navApplication.text()).to.contain('Last contact: Fri Jan 15');
      expect($navApplication.text()).to.contain('Follow-up on: Mon Jan 25');
    });
  });

  scenario.routeTest('from a logged in user with a saved for later application', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-intertrode-uuid'), expectedStatusCode: 200});

    it('lists application-specific content in the nav', function () {
      var $navApplication = this.$('.nav-row--application');
      expect($navApplication).to.have.length(1);
      expect($navApplication.find('a[href="/application/abcdef-intertrode-uuid"]')).to.have.length(1);
      expect($navApplication.text()).to.contain('Intertrode');
      expect($navApplication.text()).to.contain('Status: Saved for later');
      expect($navApplication.text()).to.contain('Saved on: Sat Dec 19');
      expect($navApplication.text()).to.contain('Apply by: Mon Jun 20');
    });
  });

  scenario.routeTest('from a logged in user with an archived application', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-monstromart-uuid'), expectedStatusCode: 200});

    it('lists application-specific content in the nav', function () {
      var $navApplication = this.$('.nav-row--application');
      expect($navApplication).to.have.length(1);
      expect($navApplication.find('a[href="/application/abcdef-monstromart-uuid"]')).to.have.length(1);
      expect($navApplication.text()).to.contain('Monstromart');
      expect($navApplication.text()).to.contain('Status: Archived');
      expect($navApplication.text()).to.contain('Archived on: Mon Jan 18');
    });
  });
});

scenario.route('A request to a page which doesn\'t load navigation', {
  // DEV: We can't test `loggedOut` without creating a development route as `nav: false` is for save actions
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from a logged in user with applications', {
    dbFixtures: [dbFixtures.APPLICATION_SKY_NETWORKS, recentlyViewedApplicationFixtures]
  }, function () {
    // Log in our user, add recently viewed applications, load our page
    // DEV: We login and load page first to avoid counting it hitting nav as we login
    // TODO: Complete form for test
    var interviewId = 'abcdef-sky-networks-interview-uuid';
    httpUtils.session.init().login();
    addRecentlyViewedApplications();
    httpUtils.session.save(serverUtils.getUrl('/interview/' + interviewId));

    // Spy on our database connection and make our request
    // DEV: We use interview page to isolate navigation only requests (i.e. applications)
    sinonUtils.spy(Application, 'findAll');
    httpUtils.session.save({
      method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId + '/delete'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('doesn\'t load any models', function () {
      var findAllSpy = Application.findAll;
      expect(findAllSpy.callCount).to.equal(0);
    });
  });
});
