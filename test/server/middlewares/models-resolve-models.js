// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to a page loading recently viewed applications', {
  dbFixtures: [/* Applications go here */],
  requiredTests: {loggedOut: false}
}, function () {
  scenario.routeTest('with a recently viewed application', function () {
    // Login, view application, and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists recently viewed applications', function () {
      expect(this.$('.nav-row--application')).to.have.length(1);
      expect(this.$('.nav-row--application').text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.routeTest('with no recently viewed applications', function () {
    // Login and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists no recently viewed applications', function () {
      expect(this.$('.nav-row--application')).to.have.length(0);
    });
  });

  scenario.routeTest('with multiple recently viewed applications', function () {
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

  scenario.routeTest.skip('with a recently viewed yet deleted application', function () {
    // Login, view/delete our application, and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/application/abcdef-umbrella-corp-uuid'))
      // Need to submit deleteion
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('doesn\'t list deleted application as a recently viewed application', function () {
      expect(this.$('.nav-row--application')).to.have.length(0);
    });
  });

  scenario.nonExistent('with more than 3 recently viewed applications', function () {
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

  scenario.routeTest('viewing an already recently viewed application', function () {
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

  scenario.routeTest('viewing an interview', function () {
    // Login and make our request
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/interview/abcdef-umbrella-corp-interview-uuid'), expectedStatusCode: 200});

    it('lists interivew\'s application as recently viewed', function () {
      expect(this.$('.nav-row--application')).to.have.length(1);
      expect(this.$('.nav-row--application').text()).to.contain('Umbrella Corporation');
    });
  });

  scenario.nonOwner.skip('from a logged in user with an application in another account', function () {
    // Login and make our request
    httpUtils.session.init().login()
      // Need to add application
      .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

    it('lists no recently viewed applications', function () {
      expect(this.$('.nav-row--application')).to.have.length(0);
    });
  });
});
