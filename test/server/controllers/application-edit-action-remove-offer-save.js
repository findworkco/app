// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
scenario.skip('A request to a POST /application/:id/remove-offer from a non-received offer application', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-sky-networks-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/remove-offer'),
      htmlForm: true, followRedirect: true,
      expectedStatusCode: 500
    });

  it.skip('receives a message about it being invalid', function () {
    // Assert error message
  });
});

scenario('A request to a POST /application/:id/remove-offer from a received offer application', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-black-mesa-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/remove-offer'),
      // DEV: We use `followAllRedirects` as this is a POST submission (which `request` doesn't respect)
      //   https://github.com/request/request/blob/v2.78.1/lib/redirect.js#L57-L63
      htmlForm: true, followRedirect: true, followAllRedirects: true,
      expectedStatusCode: 200
    });

  it.skip('redirects to application page', function () {
    // Assert redirect location
  });

  it.skip('updates application to waiting for response OR upcoming interview in database', function () {
    // Assert updated status
  });

  describe.skip('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application status updated to: Offer recieved');
    });
  });
});

scenario.skip('A request to a POST /application/:id/remove-offer from a non-owner user', function () {
  // Log in (need to do) and make our request
  var applicationId = 'abcdef-black-mesa-uuid';
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/' + applicationId + '/remove-offer'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

  it.skip('receives a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to a POST /application/:id/remove-offer for a non-existent application', function () {
  // Log in (need to do) and make our request
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/does-not-exist'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/remove-offer'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 404
    });

  it.skip('receives a 404', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

scenario.skip('A request to a POST /application/:id/remove-offer from a logged out user', function () {
  // Make our request
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/does-not-exist'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/application/does-not-exist/remove-offer'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  it('recieves a prompt to log in', function () {
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
