// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (saved for later)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-intertrode-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it('has expected actions', function () {
      var $actions = this.$('.action-bar__actions > form, .action-bar__actions > a');
      expect($actions).to.have.length(3);
      // Saved for later -> Waiting for response
      expect($actions.filter('[action="/application/' + applicationId + '/applied"]')).to.have.length(1);
      // Saved for later -> Upcoming interview
      expect($actions.filter('[href="/application/' + applicationId + '/add-interview"]')).to.have.length(1);
      // Saved for later -> Received offer
      expect($actions.filter('[action="/application/' + applicationId + '/received-offer"]')).to.have.length(1);
      // Saved for later -/> Archived
      // Not possible, should delete application instead
    });

    it('has an application reminder', function () {
      expect(this.$('[name=saved_for_later_reminder_enabled][value=yes]').attr('checked')).to.equal('checked');
      expect(this.$('[name=saved_for_later_reminder_enabled][value=no]').attr('checked')).to.equal(undefined);
      expect(this.$('[name=saved_for_later_reminder_date]').val()).to.equal('2022-06-20');
      expect(this.$('[name=saved_for_later_reminder_time]').val()).to.equal('12:00');
      expect(this.$('[name=saved_for_later_reminder_timezone]').val()).to.equal('US-America/Chicago');
    });
  });
});
