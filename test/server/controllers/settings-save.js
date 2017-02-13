// Load in our dependencies
var expect = require('chai').expect;
var Candidate = require('../../../server/models/candidate');
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario.route('A request to POST /settings', {
  // Non-owner test isn't possible due using `req.candidate`
  requiredTests: {nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/settings'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/settings'),
        // DEV: We use `followAllRedirects` to follow POST based redirects
        htmlForm: {
          timezone: 'US-America/New_York'
        }, followRedirect: true, followAllRedirects: true,
        expectedStatusCode: 200
      });

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Changes saved');
    });

    it('redirects to the settings page', function () {
      expect(this.lastRedirect).to.have.property('statusCode', 302);
      expect(this.lastRedirect.redirectUri).to.have.match(/\/settings$/);
    });

    it('updates our candidate in the database', function (done) {
      Candidate.findAll().asCallback(function handleFindAll (err, candidates) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, assert our data
        expect(candidates).to.have.length(1);
        expect(candidates[0].get('id')).to.be.a('string');
        expect(candidates[0].get('email')).to.equal('mock-email@mock-domain.test');
        expect(candidates[0].get('timezone')).to.equal('US-America/New_York');
        done();
      });
    });
  });

  scenario.routeTest('for invalid form data from the owner user', {
    dbFixtures: [dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    // DEV: We stub out possible valid timezones to force test failure
    sinonUtils.swap(Candidate.Instance.prototype.validators.timezone.isIn,
      'args', [[/* No timezones */]]);
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/settings'))
      .save({
        method: 'POST', url: serverUtils.getUrl('/settings'),
        htmlForm: {
          timezone: 'US-America/New_York'
        },
        followRedirect: false,
        expectedStatusCode: 400
      });

    it('outputs validation errors on page', function () {
      expect(this.$('#validation-errors').text()).to.contain('Invalid timezone provided');
    });

    it('reuses submitted values in inputs/textareas', function () {
      expect(this.$('select[name=timezone]').val()).to.equal('US-America/New_York');
    });
  });

  scenario.nonExistent('from a logged in yet deleted user', function () {
    // Login, load our settings, delete the user (e.g. admin deletion), and make our request
    httpUtils.session.init().login()
      .save(serverUtils.getUrl('/settings'));
    before(function deleteCandidate (done) {
      var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT_KEY];
      candidate.destroy({_allowNoTransaction: true, _sourceType: 'server'}).asCallback(done);
    });
    httpUtils.session
      .save({
        method: 'POST', url: serverUtils.getUrl('/settings'),
        htmlForm: {
          timezone: 'US-America/New_York'
        },
        followRedirect: false,
        expectedStatusCode: 302
      });

    it('redirect to /login', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });

  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({
      method: 'POST', url: serverUtils.getUrl('/settings'),
      csrfForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

    it('recieves a prompt to log in', function () {
      expect(this.res.headers).to.have.property('location', '/login');
    });
  });
});
