// Load in our dependencies
var _ = require('underscore');
var moment = require('moment-timezone');
var timezones = require('../../vendor/tz-stable.json');
void require('moment-timezone/moment-timezone-utils');

// Modify timezones to our goal
// [{countryCode: 'US', name: 'United States', locales:
//   ['America/Chicago' (ianaTimezone), ianaTimezone, ...], ...]
// to
// [{countryCode: 'US', name: 'United States', locales:
//   [{ianaTimezone: 'America/Chicago', abbrStr: 'CST/CDT', val: 'US-America/Chicago'}, ...], ...]
var lastYear = new Date().getFullYear() - 1;
timezones.forEach(function handleTimezone (timezone) {
  // Map locales to have names given by `moment`
  timezone.locales = timezone.locales.map(function resolveMomentAbbreviations (ianaTimezone) {
    // Resolve the recent timezone info
    // http://momentjs.com/timezone/docs/#/data-utilities/filter-years/
    // {name, abbrs: ['CST, 'CDT', ...], untils, offsets, population}
    var fullInfo = moment.tz.zone(ianaTimezone);
    var recentInfo = moment.tz.filterYears(fullInfo, lastYear, Infinity);

    // Resolve and save our abbreviations
    var uniqueAbbrs = _.unique(recentInfo.abbrs);
    return {
      ianaTimezone: ianaTimezone,
      abbrStr: uniqueAbbrs.join('/'),
      val: timezone.countryCode + '-' + ianaTimezone
    };
  });

  // Sort our locales by timezone abbreviations
  // ['PST', 'CST', ...] -> ['CST', 'PST', ...]
  timezone.locales.sort(function (a, b) {
    return a.abbrStr.localeCompare(b.abbrStr);
  });
});

// Sort our timezones by their name
// ['Andorra', 'United Arab Emirates', 'Afghanistan', ...]
// to
// ['Afghanistan', 'Andorra', 'United Arab Emirates', ...]
timezones.sort(function (a, b) {
  return a.name.localeCompare(b.name);
});

// Alias existing moment timezones to our custom ones
// 'America/Chicago' aliased as 'US-America/Chicago'
// DEV: After some exploration, it looks like we can't easily remove original moment timezones so be careful
timezones.forEach(function updateMomentTimezone (timezone) {
  timezone.locales.forEach(function updateLocale (locale) {
    // http://momentjs.com/timezone/docs/#/data-loading/adding-a-link/
    moment.tz.link(locale.ianaTimezone + '|' + locale.val);
  });
});

// Export our timezones
module.exports = timezones;
