// Load in our dependencies
var url = require('url');
var _ = require('underscore');
var server = require('../../../server/index.js');

// Define our exports
exports.app = server.app;
exports.config = server.config;

exports.run = function () {
  // Create a new HTTP binding for our server
  before(function runServer () {
    server.listen();
  });
  after(function cleanup (done) {
    server.close(done);
  });
  return server;
};

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
  return url.format(_.defaults(params, server.config.url.internal));
};
