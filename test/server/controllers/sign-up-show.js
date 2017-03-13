// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.route('A request to GET /sign-up', {
  requiredTests: {nonExistent: false, nonOwner: false}
}, function () {
  scenario.loggedOut('from a logged out user', function () {
    // Make our request
    httpUtils.session.init().save({url: serverUtils.getUrl('/sign-up'), expectedStatusCode: 200});

    it('recieves the sign up page', function () {
      expect(this.$('.content__heading').text()).to.equal('Sign up');
    });

    it('has a button to sign up with Google', function () {
      expect(this.$('#auth_with_google').text()).to.equal('Sign up with Google');
      expect(this.$('#auth_with_google').attr('href')).to.equal('/oauth/google/request?action=sign_up');
    });
  });
});
