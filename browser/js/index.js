// Load in our dependencies
// TODO: Reduce size of jQuery as it's quite large (e.g. remove AJAX)
var $ = require('jquery');
void require('bootstrap-datepicker');
void require('timepicker');
var Modernizr = require('browsernizr');
void require('browsernizr/test/inputtypes');
// DEV: Add in `window.jQuery` for Chosen and wysiwyg.js
window.jQuery = $;
void require('../../bower_components/chosen/chosen.jquery.js');
var contentSync = require('./content-sync');
var datetimepickerHide = require('./datetimepicker-hide');
var datetimepickerSync = require('./datetimepicker-sync');
var errorGenerators = require('./error-generators');
var notifications = require('./notifications');
var menu = require('./menu');
var researchCompanyPartial = require('./research-company-partial');
var wysiwyg = require('./wysiwyg');

// TODO: Construct an autosave mechanism for `data-autosave`

// Define our initialization bindings
// DEV: If our one-off plugins get unwieldy, relocate them to files that export an `init` function
exports.init = function (containerEl) {
  // If we don't have native support for datepicker, then use a fallback
  // DEV: We support native datepicker for better mobile experience
  if (!Modernizr.inputtypes.date) {
    // http://eternicode.github.io/bootstrap-datepicker/
    // https://bootstrap-datepicker.readthedocs.org/en/latest/index.html
    // TODO: Add component test to verify when we click a new date it changes
    //   and when we return to the original they are the same (verifies moment + component consistency)
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
    // TODO: Add component test to verify when we click a new time it changes
    //   and when we return to the original they are the same (verifies moment + component consistency)
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
  contentSync.init(containerEl);
  datetimepickerHide.init(containerEl);
  datetimepickerSync.init(containerEl);
  errorGenerators.init();
  notifications.init();
  researchCompanyPartial.init(containerEl);
  menu.init();
  wysiwyg.init();

  // If we are on a page with a `?grid` query parameter, then render a grid
  // TODO: Move to query string (currently breaks serve)
  if (window.location.hash === '#grid') {
    // Define our overrides
    // https://github.com/peol/960gridder/blob/677b61a7/releases/1.3.1/960.gridder.src.js#L42-L61
    window.gOverride = {
      gColumns: 12,
      gWidth: 9,
      pHeight: 18
    };

    // Load our grid
    var scriptEl = document.createElement('script');
    var headEl = document.querySelector('head');
    scriptEl.src = 'https://rawgit.com/peol/960gridder/677b61a7/releases/1.3.1/960.gridder.src.js';
    headEl.appendChild(scriptEl);
  }
};

// If we are not testing, bind our initializations to DOM ready
// DEV: We would use `require.main === module` but Browserify doesn't want to support that
if (process.env.ENV !== 'test') {
  $(function handleReady () {
    exports.init(document.body);
  });
}
