// Load in our dependencies
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');

// Start our tests
// DEV: If we encounter issues due to too many inputs, then switch to `/login` or `/settings`
describe('An HTTP request without a CSRF token', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/add-application'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/add-application'),
      htmlForm: function ($form) {
        $form.find('input[name="x-csrf-token"]').remove();
      },
      followRedirect: false,
      expectedStatusCode: 403
    });

  it('is rejected', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});

describe('An HTTP request with a CSRF token', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/add-application'))
    .save({
      method: 'POST', url: serverUtils.getUrl('/add-application'),
      htmlForm: true, followRedirect: false,
      expectedStatusCode: 302
    });

  it('is successful', function () {
    // Asserted by `expectedStatusCode` in `httpUtils.save()`
  });
});
