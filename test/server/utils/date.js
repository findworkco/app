// Define our exports
exports.nowInChicago = function () {
  // Return current time with 5 hour offset
  return Date.now() - (1000 * 60 * 60 * 5);
};
exports.oneWeek = function (val) {
  return 1000 * 60 * 60 * 24 * 7;
};
exports.oneHour = function (val) {
  return 1000 * 60 * 60 * 1;
};
exports.twoHours = function (val) {
  return exports.oneHour() * 2;
};
exports.startOfHour = function (val) {
  return val - (val % (1000 * 60 * 60));
};
