// Load in our dependencies
var $ = require('jquery');
void require('bootstrap-datepicker');
void require('timepicker');
var Modernizr = require('browsernizr');
void require('browsernizr/test/inputtypes');
// DEV: Add in `window.jQuery` for Chosen and wysiwyg.js
window.jQuery = $;
void require('../../bower_components/chosen/chosen.jquery.js');
// DEV: Bootstrap's `transition` must come before its `collapse`
void require('../../bower_components/bootstrap/js/transition.js');
void require('../../bower_components/bootstrap/js/collapse.js');
var backLink = require('./back-link');
var confirmSubmit = require('./confirm-submit');
var contentSync = require('./content-sync');
var datetimepickerHide = require('./datetimepicker-hide');
var datetimepickerSync = require('./datetimepicker-sync');
var errorGenerators = require('./error-generators');
var followUrl = require('./follow-url');
var notifications = require('./notifications');
var menu = require('./menu');
var researchCompanyPartial = require('./research-company-partial');
var unsavedChanges = require('./unsaved-changes');
var toggleText = require('./toggle-text');
var wysiwyg = require('./wysiwyg');

// Define our initialization bindings
// DEV: If our one-off plugins get unwieldy, relocate them to files that export an `init` function
exports.init = function (containerEl) {
  // If we don't have native support for datepicker, then use a fallback
  // DEV: We support native datepicker for better mobile experience
  if (!Modernizr.inputtypes.date) {
    // http://eternicode.github.io/bootstrap-datepicker/
    // https://bootstrap-datepicker.readthedocs.org/en/latest/index.html
    $(containerEl).find('input[type=date]').each(function handleDateInput () {
      var $el = $(this);
      $el.datepicker({
        // 2016-01-08 (same as native)
        //   http://stackoverflow.com/a/9519493
        //   https://www.w3.org/TR/2012/WD-html-markup-20120329/input.date.html#input.date.attrs.value
        assumeNearbyYear: true,
        format: 'yyyy-mm-dd',
        startDate: $el.attr('min') || -Infinity,
        endDate: $el.attr('max') || Infinity,
        todayBtn: 'linked',
        todayHighlight: true
      });
      $el.css({
        width: '7em'
      });
    });
  }

  // If we don't have native support for timepicker, then use a fallback
  // DEV: We support native timepicker for better mobile experience
  if (!Modernizr.inputtypes.time) {
    // https://github.com/jonthornton/jquery-timepicker
    $(containerEl).find('input[type=time]').each(function handleTimeInput () {
      // DEV: Native will send HH:MM (e.g. 23:10, 7:20) but can vary in presentation
      //   We will use HH:MM AM/PM (e.g. 11:10PM, 7:20AM) for user-friednliness
      //   https://www.w3.org/TR/2012/WD-html-markup-20120329/input.time.html#input.time.attrs.value
      //   https://tools.ietf.org/html/rfc3339#section-5.6
      //   http://php.net/manual/en/function.date.php (used by jquery-timepicker)
      var $el = $(this);
      $el.timepicker({
        timeFormat: 'g:iA'
      });
      $el.css({
        width: '6em'
      });
    });
  }

  // Find all Chosen inputs and bind them
  $(containerEl).find('[data-chosen]').chosen();

  // Bind our external plugins
  backLink.init(containerEl);
  confirmSubmit.init(containerEl);
  contentSync.init(containerEl);
  datetimepickerHide.init(containerEl);
  datetimepickerSync.init(containerEl);
  errorGenerators.init();
  followUrl.init(containerEl);
  notifications.init();
  researchCompanyPartial.init(containerEl);
  toggleText.init(containerEl);
  unsavedChanges.init(containerEl);
  menu.init();
  wysiwyg.init();
};

// If we are not testing, bind our initializations to DOM ready
// DEV: We would use `require.main === module` but Browserify doesn't want to support that
if (process.env.ENV !== 'test') {
  $(function handleReady () {
    exports.init(document.body);
  });
}
