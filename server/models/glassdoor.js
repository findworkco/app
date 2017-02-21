// Load in our dependencies
var _ = require('underscore');

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
