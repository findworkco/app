// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
scenario('A request to a page from a logged out user', {
  dbFixtures: null
}, function () {
  // Make our request
  httpUtils.session.init().save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('receives Sign up and Log in links in the nav sidebar', function () {
    expect(this.$('#nav a[href="/sign-up"]')).to.have.length(1);
    expect(this.$('#nav a[href="/login"]')).to.have.length(1);
    // DEV: As a sanity check, we verify all content (not only nav) lacks placeholder text
    expect(this.$('body').text()).to.not.contain('@findwork.co');
  });

  it('receives Sign up and Log in links in the nav topbar', function () {
    expect(this.$('#topbar a[href="/sign-up"]')).to.have.length(1);
    expect(this.$('#topbar a[href="/login"]')).to.have.length(1);
    expect(this.$('#topbar a[href="/settings"]')).to.have.length(0);
  });

  it('has no logout button', function () {
    expect(this.$('#nav form[action="/logout"]')).to.have.length(0);
  });
});

scenario('A request to a page from a logged in user', function () {
  // Make our request
  httpUtils.session.init().login()
    .save({url: serverUtils.getUrl('/schedule'), expectedStatusCode: 200});

  it('receives candidate email in the nav sidebar', function () {
    expect(this.$('#nav a[href="/settings"]')).to.have.length(2);
    expect(this.$('#nav a[href="/settings"]').text())
      .to.contain('mock-email@mock-domain.test');
    expect(this.$('#nav a[href="/sign-up"]')).to.have.length(0);
    expect(this.$('#nav a[href="/login"]')).to.have.length(0);
  });

  it('receives avatar with settings link in the nav topbar', function () {
    expect(this.$('#topbar a[href="/sign-up"]')).to.have.length(0);
    expect(this.$('#topbar a[href="/login"]')).to.have.length(0);
    expect(this.$('#topbar a[href="/settings"]')).to.have.length(1);
  });

  it('has a logout button', function () {
    expect(this.$('#nav form[action="/logout"]')).to.have.length(1);
  });
});
