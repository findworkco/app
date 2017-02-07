// Load in our dependencies
var url = require('url');
var _ = require('underscore');

// Load our config
var config = require('../../config').getConfig();

// Define our exports
/**
 * Retrieve a URL for our running server
 * @param params {Object|String} Information for URL
 *   If this is a string, we will assume it's the URL path
 *   Otherwise (object), we will treat it as `url.format` parameters
 * @returns URL string (e.g. `https://findwork.co/hello`)
 */
exports.getExternalUrl = function (params) {
  // If the parameter is a string, upcast it to an object
  if (typeof params === 'string') {
    params = {pathname: params};
  }

  // Return our formatted URL
  return url.format(_.defaults(params, config.url.external));
};
