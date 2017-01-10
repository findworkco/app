// Load in our dependencies
var expect = require('chai').expect;
var Promise = require('bluebird');
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
  scenario.routeTest('from a logged in user with applications', {
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
      var updateOptions = {_allowNoTransaction: true, _sourceType: 'server', validate: false};
      Promise.all([
        application.update({candidate_id: 'alt00000-0000-0000-0000-000000000000'}, updateOptions),
        reminder.update({candidate_id: 'alt00000-0000-0000-0000-000000000000'}, updateOptions)
      ]).asCallback(done);
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
