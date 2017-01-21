// Load in our dependencies
var assert = require('assert');
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
var scenarioInfoArr = [
  {type: 'saved-for-later', url: '/application/abcdef-intertrode-uuid',
    data: {humanStatus: 'Saved for later', name: 'Intertrode'},
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'waiting-for-response', url: '/application/abcdef-sky-networks-uuid',
    data: {humanStatus: 'Waiting for response', name: 'Sky Networks'},
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'upcoming-interview', url: '/application/abcdef-umbrella-corp-uuid',
    data: {humanStatus: 'Upcoming interview', name: 'Umbrella Corporation'},
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'received-offer', url: '/application/abcdef-black-mesa-uuid',
    data: {humanStatus: 'Received offer', name: 'Black Mesa'},
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]},
  {type: 'archived', url: '/application/abcdef-monstromart-uuid',
    data: {humanStatus: 'Archived', name: 'Monstromart'},
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]}
];
scenarioInfoArr.forEach(function generateScenarioTests (scenarioInfo) {
  scenario.route('A request to GET /application/:id (generic/' + scenarioInfo.type + ')', {
    // DEV: We test nonExistent, nonOwner, and loggedOut after the `forEach` as they aren't type dependent
    requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
  }, function () {
    scenario.routeTest('from the owner user', {
      dbFixtures: scenarioInfo.dbFixtures
    }, function () {
      // Log in and make our request
      var applicationData = scenarioInfo.data;
      httpUtils.session.init().login()
        .save({url: serverUtils.getUrl(scenarioInfo.url), expectedStatusCode: 200});

      it('recieves the application page', function () {
        expect(this.$('.content__heading').text()).to.equal('Job application');
        expect(this.$('.content__subheading').text()).to.equal(applicationData.name);
        expect(this.$('.action-bar__info').text()).to.equal('Status: ' + applicationData.humanStatus);
        var $form = this.$('#content form[action="' + scenarioInfo.url + '"]');
        assert.strictEqual($form.length, 1);
        expect($form.find('[name=name]').val()).to.equal(applicationData.name);
        expect($form.find('[name=posting_url]').val()).to.contain('https://');
        // DEV: We could be more thorough with note data comparison but verifying it's non-empty is good enough
        expect($form.find('[name=notes]').val()).to.match(/employees|career|website/i);
        expect($form.find('[name=company_name]').val()).to.match(/(Inc|Corp|Corporation|Labs)$/);
      });

      it('receives the proper title', function () {
        // DEV: We have title testing as we cannot test it in visual tests
        expect(this.$('title').text()).to.equal('Job application - ' + applicationData.name + ' - Find Work');
      });

      it('displays application as recently viewed in navigation', function () {
        expect(this.$('.nav-row--selected.nav-row--application')).to.have.length(1);
        expect(this.$('.nav-row--selected.nav-row--application').text()).to.contain(applicationData.name);
      });
    });
  });
});

scenario.route('A request to GET /application/:id (generic)', function () {
  scenario.nonOwner('from a non-owner user', {
    dbFixtures: [dbFixtures.APPLICATION_INTERTRODE, dbFixtures.CANDIDATE_DEFAULT, dbFixtures.CANDIDATE_ALT]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({
        url: serverUtils.getUrl('/application/abcdef-intertrode-uuid'),
        expectedStatusCode: 404
      });

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.nonExistent('that doesn\'t exist', function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/does-not-exist'), expectedStatusCode: 404});

    it('recieves a 404', function () {
      // Asserted by `expectedStatusCode` in `httpUtils.save()`
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      url: serverUtils.getUrl('/application/does-not-exist'),
      followRedirect: false,
      expectedStatusCode: 302
    });

    // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});

scenario.route('A request to GET /application/:id (generic/saved-for-later)', {
  // DEV: We test nonExistent, nonOwner, and loggedOut are tested in previous section
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-intertrode-uuid'), expectedStatusCode: 200});

    it('has no application date', function () {
      expect(this.$('[name=application_date]')).to.have.length(0);
    });

    it('lists no interview sections', function () {
      expect(this.$('.upcoming-interviews')).to.have.length(0);
      expect(this.$('.past-interviews')).to.have.length(0);
    });
  });
});

scenario.route('A request to GET /application/:id (generic/non-saved-for-later)', {
  // DEV: We test nonExistent, nonOwner, and loggedOut are tested in previous section
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from the owner user with no past interviews', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_NO_PAST_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid'), expectedStatusCode: 200});

    it('has an application date', function () {
      expect(this.$('[name=application_date]')).to.have.length(1);
    });

    it('shows a past interview section with placeholder content', function () {
      expect(this.$('.past-interviews').text()).to.contain('There are no past interviews for this job application.');
    });
  });

  scenario.routeTest('from the owner user with past interviews', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_WITH_PAST_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid'), expectedStatusCode: 200});

    // DEV: This is redundant to "no past interviews" but it's less lines of test code
    it('has an application date', function () {
      expect(this.$('[name=application_date]')).to.have.length(1);
    });

    it('shows a past interview section with interview information', function () {
      var $pastInterviewLinks = this.$('.past-interviews a[href^="/interview"]');
      expect($pastInterviewLinks).to.have.length(1);
      expect($pastInterviewLinks.eq(0).attr('href')).to.equal('/interview/abcdef-sky-networks-interview-uuid');
      expect($pastInterviewLinks.eq(0).text()).to.contain('Fri Jan 15 at 9:00AM PST');
    });
  });

  scenario.routeTest('from the owner user with no upcoming interviews', {
    // DEV: By definition, a waiting for response application isn't an upcoming interview
    //   Technically we could have an archived + upcoming interview scenario but that's neither here nor there
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-sky-networks-uuid'), expectedStatusCode: 200});

    it('doesn\'t show an upcoming interview section', function () {
      expect(this.$('.upcoming-interviews')).to.have.length(0);
    });
  });

  scenario.routeTest('from the owner user with  upcoming interviews', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'), expectedStatusCode: 200});

    it('shows an upcoming interview section with interview information', function () {
      var $upcomingInterviewLinks = this.$('.upcoming-interviews a[href^="/interview"]');
      expect($upcomingInterviewLinks).to.have.length(1);
      expect($upcomingInterviewLinks.eq(0).attr('href')).to.equal('/interview/abcdef-umbrella-corp-interview-uuid');
      expect($upcomingInterviewLinks.eq(0).text()).to.contain('Thu Jan 20 at 2:00PM CST');
    });
  });
});

scenario.route('A request to GET /application/:id (generic/archived)', {
  // DEV: We test nonExistent, nonOwner, and loggedOut are tested in previous section
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-black-mesa-uuid'), expectedStatusCode: 200});

    it('has no archived date', function () {
      expect(this.$('.archive-date')).to.have.length(0);
    });
  });
});

scenario.route('A request to GET /application/:id (generic/not-archived)', {
  // DEV: We test nonExistent, nonOwner, and loggedOut are tested in previous section
  requiredTests: {nonExistent: false, nonOwner: false, loggedOut: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/abcdef-monstromart-uuid'), expectedStatusCode: 200});

    it('has an archived date', function () {
      expect(this.$('.archive-date')).to.have.length(1);
      expect(this.$('.archive-date').text()).to.contain('Mon Jan 18 at 3:00PM CST');
    });
  });
});
