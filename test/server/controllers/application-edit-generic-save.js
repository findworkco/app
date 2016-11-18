// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario('A request to POST /application/:id to update fields from the owner user', function () {
  // Log in (need to do) and make our request
  // TODO: Complete form for test
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  it('redirects to the application page', function () {
    expect(this.res.headers.location).to.equal('/application/' + applicationId);
  });

  it.skip('updates our application in the database', function () {
    // Verify data in PostgreSQL
  });

  describe('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Changes saved');
    });
  });
});

scenario.skip('A request to POST /application/:id from a non-owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to POST /application/:id that doesn\'t exist', function () {
  // Log in (need to do) and make our request
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/does-not-exist'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

  it('recieves a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to POST /application/:id from a logged out user', function () {
  // Make our request
  httpUtils.session.init()
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
