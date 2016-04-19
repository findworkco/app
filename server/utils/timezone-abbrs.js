// Load in moment timezone and its utilities
var _ = require('underscore');
var moment = require('moment-timezone');
void require('moment-timezone/moment-timezone-utils');

// For each timezone (e.g. `America/Chicago`)
var lastYear = new Date().getFullYear() - 1;
var retVal = {};
_.values(moment.tz._names).forEach(function forEachTimezoneLocale (timezoneLocale) {
  // Resolve the recent timezone info
  // http://momentjs.com/timezone/docs/#/data-utilities/filter-years/
  // {name, abbrs: ['CST, 'CDT', ...], untils, offsets, population}
  var fullInfo = moment.tz.zone(timezoneLocale);
  var recentInfo = moment.tz.filterYears(fullInfo, lastYear, Infinity);

  // Resolve and save our abbreviations for later
  var uniqueAbbrs = _.unique(recentInfo.abbrs);
  retVal[timezoneLocale] = uniqueAbbrs;
});

// Export our retVal
module.exports = retVal;
