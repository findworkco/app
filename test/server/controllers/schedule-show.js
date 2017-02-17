// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /schedule', function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('recieves the schedule page', function () {
      expect(this.$('title').text()).to.equal('Schedule - Find Work');
    });
    it('has calls to action in large content for creating a new application or performing research', function () {
      expect(this.$('#content a').eq(0).text()).to.equal('+ Add a job application');
      expect(this.$('#content a').eq(1).text()).to.equal('Research a company');
    });
  });

  scenario.nonExistent('from a logged in user with no applications', function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    // DEV: We test these again to make sure logged in/logged out users receive same treatment
    it('recieves the schedule page', function () {
      expect(this.$('title').text()).to.equal('Schedule - Find Work');
    });
    it('has calls to action in large content for creating a new application or performing research', function () {
      expect(this.$('#content a').eq(0).text()).to.equal('+ Add a job application');
      expect(this.$('#content a').eq(1).text()).to.equal('Research a company');
    });
  });

  scenario.routeTest('from a logged in user with active applications', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('has no calls to action', function () {
      expect(this.$('#content').text()).to.not.contain('+ Add a job application');
      expect(this.$('#content').text()).to.not.contain('Research a company');
    });

    it('shows application information', function () {
      expect(this.$('#content .schedule-row--application').text()).to.contain('Intertrode');
      expect(this.$('#content .schedule-row--application a').attr('href'))
        .to.equal('/application/abcdef-intertrode-uuid');
    });
  });

  scenario.routeTest('from a logged in user with ' +
      'active applications but no upcoming interviews', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('displays empty upcoming interviews section', function () {
      // DEV: We assume user knows how to use UI now
      expect(this.$('#content #schedule__upcoming-interviews').text()).to.contain('No upcoming interviews');
    });
  });

  scenario.routeTest('from a logged in user with ' +
      'active applications but no waiting for response applications', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('displays empty upcoming interviews section', function () {
      // DEV: We assume user knows how to use UI now
      expect(this.$('#content #schedule__waiting-for-response').text()).to.contain('Not waiting for any responses');
    });
  });

  scenario.routeTest('from a logged in user with an offer received application', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists the application', function () {
      var $section = this.$('#content #schedule__received-offer');
      // Links = [Heading, button]
      expect($section.find('a[href="/application/abcdef-black-mesa-uuid"]')).to.have.length(2);
      expect($section.text()).to.contain('Black Mesa');
      expect($section.text()).to.contain('Last contact: Mon Dec 14');
      expect($section.text()).to.contain('Respond by: Sat Jan 1');
      expect($section.find('.schedule-notes').text()).to.contain('300 employees');
    });
  });

  scenario.routeTest('from a logged in user with an upcoming interview application', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists the application', function () {
      var $section = this.$('#content #schedule__upcoming-interviews');
      // Links = [Heading, button]
      expect($section.find('a[href="/application/abcdef-umbrella-corp-uuid"]')).to.have.length(2);
      expect($section.text()).to.contain('Umbrella Corporation');
      // Links = [Date/time line, button]
      expect($section.find('a[href="/interview/abcdef-umbrella-corp-interview-uuid"]')).to.have.length(2);
      expect($section.text()).to.contain('Thu Jan 20 at 2:00PM CST');
      expect($section.text()).to.contain('Go to 1200 Lake St');
      expect($section.find('.schedule-notes').text()).to.contain('1000 employees');
    });
  });

  scenario.routeTest('from a logged in user with a waiting for response application', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists the application', function () {
      var $section = this.$('#content #schedule__waiting-for-response');
      // Links = [Heading, button]
      expect($section.find('a[href="/application/abcdef-sky-networks-uuid"]')).to.have.length(2);
      expect($section.find('a[href="/application/abcdef-sky-networks-uuid/add-interview"]')).to.have.length(1);
      expect($section.text()).to.contain('Sky Networks');
      expect($section.text()).to.contain('Last contact: Fri Jan 15');
      expect($section.text()).to.contain('Follow-up on: Tue Jan 25');
      expect($section.find('.schedule-notes').text()).to.contain('100 employees');
    });
  });

  scenario.routeTest('from a logged in user with a saved for later application', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists the application', function () {
      var $section = this.$('#content #schedule__saved-for-later');
      // Links = [Heading, button]
      expect($section.find('a[href="/application/abcdef-intertrode-uuid"]')).to.have.length(2);
      expect($section.find('a[href="/application/abcdef-intertrode-uuid/add-interview"]')).to.have.length(1);
      expect($section.text()).to.contain('Intertrode');
      expect($section.text()).to.contain('Saved on: Sat Dec 19');
      expect($section.text()).to.contain('Apply by: Mon Jun 20');
      expect($section.find('.schedule-notes').text()).to.contain('Website: http://intertrode.net/');
    });
  });

  scenario.nonOwner('from a logged in user with applications in another account', {
    dbFixtures: [
      // Load all possible variants for ACL leaks
      dbFixtures.APPLICATION_RECEIVED_OFFER,
      dbFixtures.APPLICATION_UPCOMING_INTERVIEW,
      dbFixtures.APPLICATION_WAITING_FOR_RESPONSE,
      dbFixtures.APPLICATION_SAVED_FOR_LATER,

      // Load in our candidates
      dbFixtures.CANDIDATE_DEFAULT,
      dbFixtures.CANDIDATE_ALT
    ]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().loginAs(dbFixtures.CANDIDATE_ALT)
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('does not list the applications', function () {
      expect(this.$('#content a').eq(0).text()).to.equal('+ Add a job application');
      expect(this.$('#content a').eq(1).text()).to.equal('Research a company');
      expect(this.$('#content').text()).to.not.contain('Black Mesa');
      expect(this.$('#content').text()).to.not.contain('Umbrella Corporation');
      expect(this.$('#content').text()).to.not.contain('Sky Networks');
      expect(this.$('#content').text()).to.not.contain('Intertrode');
    });
  });

  scenario.routeTest('from a logged in user with an archived application', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('does not list the application', function () {
      expect(this.$('#content a').eq(0).text()).to.equal('+ Add a job application');
      expect(this.$('#content a').eq(1).text()).to.equal('Research a company');
      expect(this.$('#content').text()).to.not.contain('Monstromart');
    });
  });

  // Edge case for alternative text
  scenario.routeTest('from a logged in user with applications with no details, no notes, and disabled reminders', {
    dbFixtures: [
      dbFixtures.APPLICATION_RECEIVED_OFFER_EMPTY,
      dbFixtures.APPLICATION_UPCOMING_INTERVIEW_EMPTY,
      dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_EMPTY,
      dbFixtures.APPLICATION_SAVED_FOR_LATER_EMPTY,
      dbFixtures.DEFAULT_FIXTURES
    ]
  }, function () {
    // Log in our user and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('renders non-upcoming interview applications with reminder disabled text', function () {
      expect(this.$('#schedule__received-offer').html()).to.contain('<i>No reminder set</i>');
      expect(this.$('#schedule__waiting-for-response').html()).to.contain('<i>No reminder set</i>');
      expect(this.$('#schedule__saved-for-later').html()).to.contain('<i>No reminder set</i>');
    });

    it('renders upcoming interview applications with no details text', function () {
      expect(this.$('#schedule__upcoming-interviews').html()).to.contain('<i>No details provided</i>');
    });

    it('renders applications with no notes text', function () {
      expect(this.$('#schedule__received-offer').html()).to.contain('<i>No notes recorded</i>');
      expect(this.$('#schedule__upcoming-interviews').html()).to.contain('<i>No notes recorded</i>');
      expect(this.$('#schedule__waiting-for-response').html()).to.contain('<i>No notes recorded</i>');
      expect(this.$('#schedule__saved-for-later').html()).to.contain('<i>No notes recorded</i>');
    });
  });
});
