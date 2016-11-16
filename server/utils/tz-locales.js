// Taken from https://gist.github.com/twolfson/bfe6f1b94e95d88d7f1202476d754a95
// Load in our dependencies
var assert = require('assert');
var moment = require('moment-timezone');
var extractValues = require('extract-values');
var tzLocales = require('../../vendor/tz-locales.json');

// Resolve current tzLocales with updated strings
exports.getCurrent = function () {
  // Prepare our return data
  var retVal = {};

  // Extract country codes from Google data
  var now = new Date();
  Object.keys(tzLocales).forEach(function handleCountryCode (countryCode, i) {
    // Resolve our country info from Google data
    // DEV: This is a smaller list of timezones than moment-timezone (covers major areas)
    var googleCountryInfo = tzLocales[countryCode];
    var countryVal = {};
    Object.keys(googleCountryInfo).forEach(function handleTimezone (timezoneKey) {
      // Resolve our timezone name
      var originalName = googleCountryInfo[timezoneKey];
      var timezoneName = extractValues(originalName, '(GMT{offset}) {name}').name;
      assert(timezoneName, 'Unable to find name for "' + timezoneKey + '"');

      // Resolve our offset string (e.g. -03:00)
      var tzMoment = moment.tz(now, timezoneKey);
      var offsetStr = tzMoment.format('Z');

      // Save our full offset string (e.g. (GMT-03:00) Palmer)
      countryVal[timezoneKey] = '(GMT' + offsetStr + ') ' + timezoneName;
    });

    // Save our resolved info under the country code
    retVal[countryCode] = countryVal;
  });

  // Return our new data
  return retVal;
};
