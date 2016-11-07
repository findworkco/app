// Load in our dependencies
var moment = require('moment-timezone');

// Define our exports
exports.nowInChicago = function () {
  // DEV: Due to DST, we must use `moment.tz` initially
  // http://momentjs.com/timezone/docs/#/zone-object/offset/
  var now = +new Date();
  // Example: 360 (minutes)
  var offset = moment.tz.zone('America/Chicago').offset(now);
  return now - (offset * 1000 * 60);
};
exports.oneWeek = function () {
  return 1000 * 60 * 60 * 24 * 7;
};
exports.oneHour = function () {
  return 1000 * 60 * 60 * 1;
};
exports.twoHours = function () {
  return exports.oneHour() * 2;
};
exports.startOfHour = function (val) {
  return val - (val % (1000 * 60 * 60));
};
