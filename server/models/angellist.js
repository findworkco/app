// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Promise = require('bluebird');

// Define a helper for consistent empty results
exports.getEmptyResult = function () {
  return {_serializeExempt: true};
};

// Define and export our "model"
// DEV: We expose/return a Promise for consistency with other model loaders
exports._parseResponse = function (result, companyName) {
  // If there was nothing found, return an empty object
  if (!result) {
    return exports.getEmptyResult();
  }

  // Clone our current result (not a deep clone for CEO unfortunately)
  // See HTTP fixtures for result format
  var retVal = _.clone(result);

  // Add on custom properties
  // Form: https://docs.google.com/a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/edit
  retVal.badMatchUrl = 'https://docs.google.com/' +
    'a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/formResponse' +
    '?entry.1562009024=' + encodeURIComponent(companyName) +
    '&entry.978071742=' + encodeURIComponent(retVal.id);
  retVal._serializeExempt = true;

  // DEV: We don't yet have support for extended results
  // if (extendedResults === true) {
  //   // DEV: Pulled fundraising via GET /startups?filter=raising
  //   retVal.angelListResult.public_fundraising = [
  //     {name: 'Series B', content: '$24M ($150M valuation) on Sep 22, 2013'},
  //     {name: 'Series A', content: null} // Details unknown
  //   ];
  // }

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
    // Always callback with no content for now
    // DEV: We use `process.nextTick` to prevent zalgo
    return process.nextTick(function handleNextTick () {
      callback(null, exports.getEmptyResult());
    });
  });
};
