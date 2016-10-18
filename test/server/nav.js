// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('A request to /schedule from a logged out user', function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('receives Sign up and Log in links in the nav bar', function () {
    // DEV: 2 sign up and log in links (1 for large/small, 1 for medium)
    expect(this.$('.nav__top a[href="/sign-up"]')).to.have.length(2);
    expect(this.$('.nav__top a[href="/login"]')).to.have.length(2);
    // DEV: As a sanity check, we verify all content (not only nav__top) lacks placeholder text
    expect(this.$('body').text()).to.not.contain('@findwork.co');
  });
});

scenario('A request to /schedule from a logged in user', function () {
  // Make our request
  httpUtils.session.init().login()
    .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('receives candidate email in the nav bar', function () {
    expect(this.$('.nav__top a[href="/settings"]')).to.have.length(1);
    expect(this.$('.nav__top a[href="/settings"]').text())
      .to.equal('mock-email@mock-domain.test');
    expect(this.$('.nav__top a[href="/sign-up"]')).to.have.length(0);
    expect(this.$('.nav__top a[href="/login"]')).to.have.length(0);
  });
});

scenario('A request to a non-/schedule page from a logged out user', function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/add-application'), expectedStatusCode: 200});

  it('receives Sign up and Log in links in the nav bar', function () {
    // DEV: 2 sign up and log in links (1 for large, 1 for medium, 1 for small)
    expect(this.$('.nav__top a[href="/sign-up"]')).to.have.length(3);
    expect(this.$('.nav__top a[href="/login"]')).to.have.length(3);
    // DEV: As a sanity check, we verify all content (not only nav__top) lacks placeholder text
    expect(this.$('body').text()).to.not.contain('@findwork.co');
  });
});

scenario('A request to non-/schedule page from a logged in user', function () {
  // Make our request
  httpUtils.session.init().login()
    .save({url: serverUtils.getUrl('/add-application'), expectedStatusCode: 200});

  it('receives candidate email in the nav bar', function () {
    // DEV: 2 settings links (1 for large, none for medium, 1 for small)
    expect(this.$('.nav__top a[href="/settings"]')).to.have.length(2);
    expect(this.$('.nav__top a[href="/settings"]').eq(0).text())
      .to.equal('mock-email@mock-domain.test');
    expect(this.$('.nav__top a[href="/settings"]').eq(1).text())
      .to.equal('mock-email@mock-domain.test');
    expect(this.$('.nav__top a[href="/sign-up"]')).to.have.length(0);
    expect(this.$('.nav__top a[href="/login"]')).to.have.length(0);
  });
});
