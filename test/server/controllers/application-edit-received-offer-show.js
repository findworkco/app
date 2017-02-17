// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (received offer)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-black-mesa-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it('has expected actions', function () {
      var $actions = this.$('.action-bar__actions > form, .action-bar__actions > a');
      expect($actions).to.have.length(2);
      // Received offer -/> Saved for later
      //   Not possible currently due to seeming unlikely...
      // Received offer -> Waiting for response
      //   OR
      // Received offer -> Upcoming interview
      // DEV: We could have an "Add interview" button
      //   but if they have an offer already, then they are unlikely to have new interviews
      expect($actions.filter('[action="/application/' + applicationId + '/remove-offer"]')).to.have.length(1);
      // Received offer -> Archived
      expect($actions.filter('[action="/application/' + applicationId + '/archive"]')).to.have.length(1);
    });

    it('has a offer response reminder', function () {
      expect(this.$('[name=received_offer_reminder_enabled][value=yes]').attr('checked')).to.equal('checked');
      expect(this.$('[name=received_offer_reminder_enabled][value=no]').attr('checked')).to.equal(undefined);
      expect(this.$('[name=received_offer_reminder_date]').val()).to.equal('2022-01-01');
      expect(this.$('[name=received_offer_reminder_time]').val()).to.equal('12:00');
      expect(this.$('[name=received_offer_reminder_timezone]').val()).to.equal('US-America/Chicago');
    });
  });
});
