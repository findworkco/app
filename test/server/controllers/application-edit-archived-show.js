// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (archived)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-monstromart-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it('has expected actions', function () {
      var $actions = this.$('.action-bar__actions > form, .action-bar__actions > a');
      expect($actions).to.have.length(1);
      // Archived -/> Saved for later
      //   Not possible currently due to seeming unlikely...
      // Archived -> Waiting for response
      // OR
      // Archived -> Upcoming interview
      // OR
      // Archived -> Received offer
      // DEV: We could have an "Add interview" action
      //   but for past ones we have an "Add interview" button in "Past interviews"
      //   and there should be no upcoming interviews as we are archived
      expect($actions.filter('[action="/application/' + applicationId + '/restore"]')).to.have.length(1);
    });

    // DEV: We explicitly test this to prevent past states' reminders from being shown
    it('lists no reminders', function () {
      expect(this.$('saved_for_later_reminder_date')).to.have.length(0);
      expect(this.$('waiting_for_response_reminder_date')).to.have.length(0);
      expect(this.$('received_offer_reminder_date')).to.have.length(0);
    });

    // Archived at section is tested in common as the non-archived test fits it better
  });
});
