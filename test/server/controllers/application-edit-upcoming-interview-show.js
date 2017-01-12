// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /application/:id (upcoming interview)', {
  // DEV: requiredTests are taken care of by `generic` test
  requiredTests: {loggedOut: false, nonExistent: false, nonOwner: false}
}, function () {
  scenario.routeTest('from the owner user', {
    dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
  }, function () {
    // Log in and make our request
    var applicationId = 'abcdef-umbrella-corp-uuid';
    httpUtils.session.init().login()
      .save({url: serverUtils.getUrl('/application/' + applicationId), expectedStatusCode: 200});

    it('has expected actions', function () {
      var $actions = this.$('.action-bar__actions > form, .action-bar__actions > a');
      expect($actions).to.have.length(2);
      // Upcoming interview -/> Saved for later
      //   Not possible currently due to seeming unlikely...
      // Upcoming interview -/> Waiting for response
      //   Must be done via deleting an interview
      // DEV: We could have an "Add interview" button
      //   but we have "Add interview" linked on "Upcoming interviews" section so we're covered
      // Upcoming interview -> Received offer
      expect($actions.filter('[action="/application/' + applicationId + '/received-offer"]')).to.have.length(1);
      // Upcoming interview -> Archived
      expect($actions.filter('[action="/application/' + applicationId + '/archive"]')).to.have.length(1);
    });

    // There is no reminder to assert for
    // Upcoming interviews being visible/not is tested in `generic`
    //   due to archived applications possibly having upcoming interviews
  });
});
