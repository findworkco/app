// Load in our dependencies
var assert = require('assert');
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

// Allow fetching session info
exports.getSession = function (cb) {
  // Resolve our sessions by their key
  app.redisClient.keys('sess:*', function handleKeys (err, keys) {
    // If there was an error, callback with it
    if (err) { return cb(err); }

    // Retrieve our session
    assert.strictEqual(keys.length, 1,
      '`serverUtils.getSession` expected Redis to have 1 session but received ' + keys.length);
    app.redisClient.get(keys[0], function handleGet (err, sessionStr) {
      // If there was an error, callback with it
      if (err) { return cb(err); }

      // Parse and callback with our result
      try {
        cb(null, JSON.parse(sessionStr));
      } catch (err) {
        cb(err);
      }
    });
  });
};
