// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (waiting for response)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-sky-networks-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it('has expected actions', function () {
      var $actions = this.$('.action-bar__actions > form, .action-bar__actions > a');
      expect($actions).to.have.length(3);
      // Waiting for response -/> Saved for later
      //   Not possible currently due to seeming unlikely...
      // Waiting for response -> Upcoming interview
      expect($actions.filter('[href="/application/' + applicationId + '/add-interview"]')).to.have.length(1);
      // Waiting for response -> Received offer
      expect($actions.filter('[action="/application/' + applicationId + '/received-offer"]')).to.have.length(1);
      // Waiting for response -> Archived
      expect($actions.filter('[action="/application/' + applicationId + '/archive"]')).to.have.length(1);
    });

    it('has a follow up reminder', function () {
      expect(this.$('[name=waiting_for_response_reminder_enabled][value=yes]').attr('checked')).to.equal('checked');
      expect(this.$('[name=waiting_for_response_reminder_enabled][value=no]').attr('checked')).to.equal(undefined);
      expect(this.$('[name=waiting_for_response_reminder_date]').val()).to.equal('2022-01-25');
      expect(this.$('[name=waiting_for_response_reminder_time]').val()).to.equal('12:00');
      expect(this.$('[name=waiting_for_response_reminder_timezone]').val()).to.equal('US-America/Chicago');
    });
  });
});
