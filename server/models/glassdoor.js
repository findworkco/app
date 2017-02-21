// Load in our dependencies
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var Promise = require('bluebird');
var request = require('request');

// Load our config
var config = require('../../config').getConfig();

// Define a helper for consistent empty results
exports.getEmptyResult = function () {
  return {_serializeExempt: true};
};

// Define and export our "model"
// DEV: We expose/return a Promise for consistency with other model loaders
exports._parseResponse = function (response, companyName) {
  // Load our response info
  var result = response.employers[0];

  // If there was nothing found, return an empty object
  if (!result) {
    return exports.getEmptyResult();
  }

  // Clone our current result (not a deep clone for CEO unfortunately)
  // See HTTP fixtures for result format
  var retVal = _.clone(result);

  // Add on custom properties
  // DEV: We found `glassdoorUrl` via manual testing (tested with spaces and no spaces)
  //   {name: 'Google eLearn Services', id: 1186310}
  //   to https://www.glassdoor.com/Overview/Working-at-Google eLearn Services-EI_IE1186310.htm
  //   which redirects to https://www.glassdoor.com/Overview/Working-at-Google-eLearn-Services-EI_IE1186310.11,33.htm
  retVal.glassdoorUrl = 'https://www.glassdoor.com/Overview/' +
    'Working-at-' + encodeURIComponent(retVal.name) + '-EI_IE' +
    encodeURIComponent(retVal.id) + '.htm';
  retVal.attributionURL = response.attributionURL;
  retVal.badMatchUrl = 'https://docs.google.com/' +
    'a/findwork.co/forms/d/1b_pmseT_J0bG_9vK-CA7XGJTy-IOMDq0MvrXGREN4k8/formResponse' +
    '?entry.1562009024=' + encodeURIComponent(companyName) +
    '&entry.978071742=' + encodeURIComponent(retVal.id);
  retVal._serializeExempt = true;

  // Return our retVal
  return retVal;
};
exports.searchAsPromise = function (companyName, req) {
  // Verify we have our parameters
  assert.notEqual(companyName, undefined);
  assert.notEqual(req, undefined);

  // Create and return our promise
  // http://bluebirdjs.com/docs/api/promise.fromcallback.html
  return Promise.fromCallback(function handleFromCallback (callback) {
    // If there was no company name, then callback with an empty object
    // DEV: We use `process.nextTick` to prevent zalgo
    if (!companyName) {
      return process.nextTick(function handleNextTick () {
        callback(null, exports.getEmptyResult());
      });
    }

    // Make our request
    // DEV: We don't cache content as the response headers say:
    //   Cache-Control: no-cache,no-store,must-revalidate
    //   Pragma: no-cache
    //   and seem to be maintained by Cloudflare
    //   Server: cloudflare-nginx
    //   CF-RAY: 3346530c0c141b9d-SEA
    var glassdoorTimeout = config.glassdoor.timeout; assert(glassdoorTimeout);
    request({
      // https://www.glassdoor.com/developer/index.htm
      // https://www.glassdoor.com/developer/companiesApiActions.htm
      // Example: https://api.glassdoor.com/api/api.htm?v=1&format=json&action=employers&q=http%3A%2F%2Fgoogle.com%2F&ps=1&userip=127.0.0.1&useragent=Node.js/4.6.2&t.p=55428&t.k=****
      json: true,
      timeout: glassdoorTimeout,
      url: url.format(_.defaults({
        pathname: '/api/api.htm',
        query: {
          v: '1',
          format: 'json',
          action: 'employers',
          q: companyName,
          ps: 1,
          userip: req.ip,
          useragent: req.headers['user-agent'],
          't.p': config.glassdoor.partnerId,
          't.k': config.glassdoor.key
        }
      }, config.glassdoor.url))
    }, function handleRequest (err, res, json) {
      // If there was an error, callback with it
      if (err) {
        return callback(err);
      }

      // Otherwise, if we received an unsuccessful message, callback
      // {success: true, status: 'OK',
      //  jsessionid: '6DC43E3472A0307625593649FB222786',
      //  response: {attributionURL, employers, ...}}
      // {success: false, status: 'Access-Denied'}
      if (json.success !== true) {
        return callback(new Error('Received unsuccessful response from Glassdoor: "' + json.status + '"'));
      }

      // Otherwise, parse and callback with our info
      var response = json.response;
      var retVal = exports._parseResponse(response, companyName);
      callback(null, retVal);
    });
  });
};
