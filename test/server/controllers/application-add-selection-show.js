// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to GET /add-application', function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/add-application'), expectedStatusCode: 200});

  it('recieves the add application selection page', function () {
    expect(this.$('.content__heading').text()).to.equal('Add job application');
    expect(this.$('.content__subheading').text()).to.contain('What stage of');
  });

  it('has a links to deeper add application forms', function () {
    expect(this.$('#content a[href="/research-company"]').length).to.equal(1);
    expect(this.$('#content a[href="/add-application/save-for-later"]').length).to.equal(1);
    expect(this.$('#content a[href="/add-application/waiting-for-response"]').length).to.equal(1);
    expect(this.$('#content a[href="/add-application/upcoming-interview"]').length).to.equal(1);
    expect(this.$('#content a[href="/add-application/received-offer"]').length).to.equal(1);
  });
});
