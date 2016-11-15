// Load in our dependencies
var _ = require('underscore');
var timezonesByCountryCode = require('../../vendor/tz-locales.json');

// Extract the timezones as values themselves
//   ['Pacific/Efate', 'Pacific/Wallis', 'Pacific/Apia', ...]
module.exports = _.union.apply(_, _.values(timezonesByCountryCode).map(function extractTimezone (timezoneObj) {
  return Object.keys(timezoneObj);
}));
