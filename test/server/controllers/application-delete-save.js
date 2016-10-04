// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /application/:id/delete from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Complete form for test
  var applicationId = 'abcdef-sky-networks-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/delete'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  it('redirects to the schedule', function () {
    expect(this.res.headers.location).to.equal('/schedule');
  });

  it.skip('deletes our application from the database', function () {
    // Verify data in PostgreSQL
  });

  describe('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of deletion success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application deleted');
    });
  });
});

describe.skip('A request to POST /application/:id/delete from a non-owner user', function () {
  // Start our server, log in (need to do), and make our request
  var applicationId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/delete'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

describe.skip('A request to POST /application/:id/delete that doesn\'t exist', function () {
  // Start our server, log in (need to do), and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/does-not-exist'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/delete'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

describe.skip('A request to POST /application/:id/delete from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/delete'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
