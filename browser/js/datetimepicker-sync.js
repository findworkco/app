// Load in our dependencies
var assert = require('assert');
var $ = require('jquery');
var Modernizr = require('browsernizr');
var forEach = Array.prototype.forEach;

// Define/export common helpers
// DEV: We don't test native functionality directly -- please do that via manual testing
//   We can also consider adding Chrome to test suite
function trueFn() { return true; }
exports.getDateFromDatetimepicker = function (datetimepickerEl) {
  // Resolve our elements
  // dateEl.value = 'YYYY-MM-DD' (native, datepicker)
  var dateEl = datetimepickerEl.querySelector('input[type=date]'); assert(dateEl);
  // timeEl.value = 'HH:MM' (native), 'g:iA' (datepicker -- e.g. 8:00PM)
  var timeEl = datetimepickerEl.querySelector('input[type=time]'); assert(timeEl);

  // Extract a common date format
  var dateStr = dateEl.value;
  if (Modernizr.inputtypes.time) {
    // '2017-02-14' + 'T' + '17:00' + 'Z'
    var timeStr = timeEl.value;
    return new Date(dateStr + 'T' + timeStr + 'Z');
  } else {
    // https://github.com/jonthornton/jquery-timepicker/tree/1.11.9#methods
    // '2017-02-14' + 'T00:00Z' + secondsFromMidnight
    var secondsFromMidnight = $(timeEl).timepicker('getSecondsFromMidnight');
    var midnightDate = new Date(dateStr + 'T00:00Z');
    return new Date((+midnightDate) + (secondsFromMidnight * 1000));
  }
};
exports.setDateToDatetimepicker = function (datetimepickerEl, date) {
  // Resolve and update our elements
  var dateEl = datetimepickerEl.querySelector('input[type=date]'); assert(dateEl);
  var timeEl = datetimepickerEl.querySelector('input[type=time]'); assert(timeEl);
  if (Modernizr.inputtypes.date) {
    // '2017-02-23T00:00:00.000Z' -> '2017-02-23'
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    // DEV: This requires manual testing due to only testing in PhantomJS currently
    dateEl.value = date.toISOString().replace(/T.+/, '');
  } else {
    // https://bootstrap-datepicker.readthedocs.io/en/latest/methods.html#setdate
    // DEV: We disable/ignore date range checks as HTML5 inputs ignore `min`/`max` on JS based set
    var datepickerObj = $(dateEl).data('datepicker'); assert(datepickerObj);
    datepickerObj.dateWithinRange = trueFn;
    $(dateEl).datepicker('setUTCDate', date);
  }
  if (Modernizr.inputtypes.time) {
    // '2017-02-23T14:30:00.000Z' -> '14:30:00.000'
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    // DEV: This requires manual testing due to only testing in PhantomJS currently
    timeEl.value = date.toISOString().replace(/[^T]+T([^Z]+)Z/, '$1');
  } else {
    // https://github.com/jonthornton/jquery-timepicker/tree/1.11.9#methods
    // DEV: We use seconds instead of Date as timepicker doesn't handle timezone-ful browsers nicely
    //   (e.g. 2PM + 2:00 -> 1AM instead of 4PM)
    // DEV: We strip away date rollover to remove daylight savings time error
    //   In the library, they use Jan 1 1970 as base date so we want to stay on that day
    var secondsFromEpoch = (+date) / 1000;
    var secondsFromMidnight = secondsFromEpoch % (24 * 60 * 60);
    return $(timeEl).timepicker('setTime', secondsFromMidnight);
  }
};

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all datetimepicker sync sets and bind them
  $(containerEl).find('[data-datetimepicker-sync]').each(function handleDatetimepickerSyncEl (i, srcEl) {
    // Find our target element
    var targetSelector = srcEl.getAttribute('data-datetimepicker-sync');
    var targetEls = containerEl.querySelectorAll(targetSelector);
    assert(targetEls.length, 'Unable to find datetimepicker sync target from selector "' + targetSelector + '"');

    // Localize all our elements
    var srcTimezoneEl = srcEl.querySelector('select[data-chosen]'); assert(srcTimezoneEl);
    var srcOriginalDate = exports.getDateFromDatetimepicker(srcEl);
    var srcOriginalTimezone = $(srcTimezoneEl).val();

    // Bind date and time syncs
    function handleDateTimeChange(evt) {
      // Calculate diff of old src time to new src time
      var srcNewDate = exports.getDateFromDatetimepicker(srcEl);
      var srcDateDelta = (+srcNewDate) - (+srcOriginalDate);

      // For each of target datetimepickers
      forEach.call(targetEls, function updateTargetEls (targetEl) {
        // Add diff to current target time (may be negative)
        var targetOriginalDate = exports.getDateFromDatetimepicker(targetEl);
        var targetNewDate = new Date((+targetOriginalDate) + srcDateDelta);

        // Update target time
        exports.setDateToDatetimepicker(targetEl, targetNewDate);
      });

      // Overwrite original date
      srcOriginalDate = srcNewDate;
    }
    var srcDateEl = srcEl.querySelector('input[type=date]'); assert(srcDateEl);
    var srcTimeEl = srcEl.querySelector('input[type=time]'); assert(srcTimeEl);
    $(srcDateEl).on('change', handleDateTimeChange);
    $(srcTimeEl).on('change', handleDateTimeChange);
    $(srcTimeEl).on('changeTime', handleDateTimeChange);

    // Bind timezone syncs
    $(srcTimezoneEl).on('change', function handleTimezoneChange (evt) {
      // Resolve new timezone
      var srcNewTimezone = $(srcTimezoneEl).val();

      // For each of target datetimepickers
      forEach.call(targetEls, function updateTargetEls (targetEl) {
        // If our original timezones match, then sync them
        var targetTimezoneEl = targetEl.querySelector('select[data-chosen]'); assert(targetTimezoneEl);
        var targetOriginalTimezone = $(targetTimezoneEl).val();
        if (targetOriginalTimezone === srcOriginalTimezone) {
          $(targetTimezoneEl).val(srcNewTimezone);
        }
      });

      // Overwrite original timezone
      srcOriginalTimezone = srcNewTimezone;
    });
  });
};
