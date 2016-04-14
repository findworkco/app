// Load in our dependencies
// TODO: Reduce size of jQuery if it gets unwieldy (e.g. remove AJAX)
var $ = require('jquery');
void require('bootstrap-datepicker');
var Modernizr = require('browsernizr');
void require('browsernizr/test/inputtypes');

// When the DOM is ready
// DEV: If our one-off plugins get unwieldy, relocate them to files that export an `init` function
$(function handleReady () {
  // If we don't have native support for datepicker, then use a fallback
  if (!Modernizr.inputtypes.date) {
    // http://eternicode.github.io/bootstrap-datepicker/
    // https://bootstrap-datepicker.readthedocs.org/en/latest/index.html
    // TODO: Add component test to verify when we click a new date it changes
    //   and when we return to the original they are the same (verifies moment + component consistency)
    $('input[type=date]').each(function handleDateInput () {
      var $el = $(this);
      $el.datepicker({
        // 2016-01-08
        format: 'yyyy-mm-dd',
        todayBtn: 'linked',
        todayHighlight: true
      });
    });
  }
});
