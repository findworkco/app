// Load in our dependencies
var url = require('url');
var _ = require('underscore');
var server = require('../../../server/index.js');
var sinonUtils = require('../../utils/sinon');

// Define our exports
var app = exports.app = server.app;
var config = exports.config = server.config;

/**
 * Retrieve a URL for our running server
 * @param params {Object|String} Information for URL
 *   If this is a string, we will assume it's the URL path
 *   Otherwise (object), we will treat it as `url.format` parameters
 * @returns URL string (e.g. `http://localhost:9000/hello`)
 */
exports.getUrl = function (params) {
  // If the parameter is a string, upcast it to an object
  if (typeof params === 'string') {
    params = {pathname: params};
  }

  // Return our formatted URL
  return url.format(_.defaults(params, config.url.internal));
};

// Allow stubbing emails
exports.stubEmails = function () {
  // https://github.com/nodemailer/nodemailer/tree/v2.6.4#transports
  sinonUtils.stub(app.emailClient.transporter, 'send', function handleSend (mail, callback) {
    // On the next tick, callback
    // DEV: We use next tick to prevent zalgo
    process.nextTick(callback);
  });
  before(function defineEmailSpy () {
    this.emailSendStub = app.emailClient.transporter.send;
  });
  after(function cleanup () {
    delete this.emailSendStub;
  });
};
