// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /add-application for a logged in user', function () {
  // Start our server, login, and make our request
  // TODO: Complete form for test
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/add-application'))
    .save({method: 'POST', url: serverUtils.getUrl('/add-application'), htmlForm: true, followRedirect: false});

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('redirects to the new application\'s page', function () {
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers.location).to.have.match(/^\/application\/[^\/]+$/);
  });

  it.skip('creates our application in the database', function () {
    // Verify data in PostgreSQL
  });

  describe('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of creation success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application saved');
    });
  });
});

describe.skip('A request to POST /add-application for a logged out user', function () {
  // Start our server and make our request
  // TODO: Complete form for test
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/add-application'))
    .save({method: 'POST', url: serverUtils.getUrl('/add-application'), htmlForm: true, followRedirect: false});

  it('redirects to sign up page', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('location', '/login');
  });

  describe.skip('on signup completion', function () {
    it('redirects to the new application\'s page', function () {
    });

    it('creates our application in the database', function () {
      // Verify data in PostgreSQL
    });

    describe('on redirect completion', function () {
      httpUtils.session.save(serverUtils.getUrl('/schedule'));

      it('notifies user of creation success', function () {
        expect(this.$('#notification-content > [data-notification=success]').text())
          .to.equal('Application saved');
      });
    });
  });
});
