// Load in our dependencies
var HttpError = require('http-errors');
var moment = require('moment-timezone');
var qsMultiDict = require('querystring-multidict');
var MultiDict = require('querystring-multidict/lib/multidict');

// Extend MultiDict to support custom types (i.e. booleans, moments)
// https://github.com/twolfson/querystring-multidict/blob/1.1.0/lib/multidict.js
MultiDict.prototype.getBoolean = function (key, defaultVal) {
  var valStr = this.get(key);
  if (valStr !== undefined) {
    return valStr === 'yes';
  }
  return defaultVal;
};
MultiDict.prototype.fetchBoolean = function (key) {
  var valStr = this.fetch(key);
  return valStr === 'yes';
};

// See datepicker/timepicker plugins for references at different data formats
// http://momentjs.com/docs/#/parsing/string-formats/
// http://momentjs.com/timezone/docs/#/using-timezones/
// http://momentjs.com/docs/#/displaying/format/
function createMomentDateOnly(dateStr) {
  return moment(dateStr,
    ['YYYY-MM-DD',
     'YYYY/MM/DD',
     'MM-DD-YYYY']);
}
function createMomentTimezone(dateStr, timeStr, timezoneStr) {
  return moment.tz(dateStr + 'T' + timeStr,
    ['YYYY-MM-DDTh:mmA', 'YYYY-MM-DDTHH:mm:ss.SSS',
     'YYYY/MM/DDTh:mmA', 'YYYY/MM/DDTHH:mm:ss.SSS',
     'MM-DD-YYYYTh:mmA', 'MM-DD-YYYYTHH:mm:ss.SSS'], timezoneStr);
}
// DEV: We considered using same suffix logic as `models/base.js` but it feels wrong for request bodies =/
MultiDict.prototype.getMomentDateOnly = function (key, defaultVal) {
  var dateStr = this.get(key);
  if (dateStr !== undefined) {
    var retMoment = createMomentDateOnly(dateStr);
    if (retMoment.isValid()) {
      return retMoment;
    }
  }
  return defaultVal;
};
MultiDict.prototype.fetchMomentDateOnly = function (key) {
  var dateStr = this.fetch(key);
  var retMoment = createMomentDateOnly(dateStr);
  if (!retMoment.isValid()) {
    throw new HttpError.BadRequest('Invalid date passed to "' + key + '"');
  }
  return retMoment;
};
MultiDict.prototype.getMomentTimezone = function (key, defaultVal) {
  var dateStr = this.get(key + '_date');
  var timeStr = this.get(key + '_time');
  var timezoneStr = this.get(key + '_timezone');
  if (dateStr !== undefined && timeStr !== undefined && timezoneStr !== undefined) {
    var retMoment = createMomentTimezone(dateStr, timeStr, timezoneStr);
    if (retMoment.isValid()) {
      return retMoment;
    }
  }
  return defaultVal;
};
MultiDict.prototype.fetchMomentTimezone = function (key) {
  var dateStr = this.fetch(key + '_date');
  var timeStr = this.fetch(key + '_time');
  var timezoneStr = this.fetch(key + '_timezone');
  var retMoment = createMomentTimezone(dateStr, timeStr, timezoneStr);
  if (!retMoment.isValid()) {
    throw new HttpError.BadRequest('Invalid date/time/timezone passed to "' + key + '"');
  }
  return retMoment;
};

// Export our normal parser and re-expose MultiDict for convenience
module.exports = qsMultiDict;
module.exports.MultiDict = MultiDict;
