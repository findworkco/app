// Load in our dependencies
var assert = require('assert');
var $ = require('jquery');
var getDateFromDatetimepicker = require('./datetimepicker-sync').getDateFromDatetimepicker;
var forEach = Array.prototype.forEach;

// Define common helpers
// DEV: We don't test native functionality directly -- please do that via manual testing
//   We can also consider adding Chrome to test suite
exports.getTimezoneDateFromDatetimepicker = function (datetimepickerEl) {
  // Load our timezone-less date from our datepicker
  var _date = getDateFromDatetimepicker(datetimepickerEl);

  // Grab out timezone offset (e.g. -360 /* minutes */)
  var timezoneEl = datetimepickerEl.querySelector('select[data-chosen]'); assert(timezoneEl);
  var timezoneOptionEl = timezoneEl.options[timezoneEl.selectedIndex];
  var tzOffsetStr = timezoneOptionEl.getAttribute('data-tz-offset'); assert(tzOffsetStr);
  var tzOffset = parseInt(tzOffsetStr, 10);

  // Add on our timezone offset and return our date
  // DEV: Be sure to test offset manually locally in browser for exact current time
  var date = new Date((+_date) - (tzOffset * 60 * 1000));
  return date;
};

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all datetimepicker hide sets and bind them
  $(containerEl).find('[data-datetimepicker-hide]').each(function handleDatetimepickerHideEl (i, srcEl) {
    // Find our target element
    var targetSelector = srcEl.getAttribute('data-datetimepicker-hide');
    var targetEls = containerEl.querySelectorAll(targetSelector);
    assert(targetEls.length, 'Unable to find datetimepicker hide target from selector "' + targetSelector + '"');

    // Bind change listeners
    function handleChange(evt) {
      // Resolve our current time setting
      var srcDate = exports.getTimezoneDateFromDatetimepicker(srcEl);
      var now = new Date();

      // If it's a past interview, then hide our target elements
      if (srcDate < now) {
        forEach.call(targetEls, function showEls (targetEl) {
          $(targetEl).addClass('hidden');
        });
      // Otherwise, show our interviews
      } else {
        forEach.call(targetEls, function showEls (targetEl) {
          $(targetEl).removeClass('hidden');
        });
      }
    }
    var srcDateEl = srcEl.querySelector('input[type=date]'); assert(srcDateEl);
    var srcTimeEl = srcEl.querySelector('input[type=time]'); assert(srcTimeEl);
    var srcTimezoneEl = srcEl.querySelector('select[data-chosen]'); assert(srcTimeEl);
    $(srcDateEl).on('change', handleChange);
    $(srcTimeEl).on('change', handleChange);
    $(srcTimeEl).on('changeTime', handleChange);
    $(srcTimezoneEl).on('change', handleChange);
    handleChange();
  });
};
