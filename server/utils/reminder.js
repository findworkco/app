// Load in our dependencies
var assert = require('assert');
var moment = require('moment-timezone');

// Define common default moments for reminders
exports.getSavedForLaterDefaultMoment = function (timezone) {
  assert(timezone);
  return moment().tz(timezone).startOf('hour').add({weeks: 1, hours: 1});
};
