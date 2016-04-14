// Load in our dependencies
// TODO: Reduce size of jQuery if it gets unwieldy (e.g. remove AJAX)
var $ = require('jquery');
void require('bootstrap-datepicker');

// When the DOM is ready
// DEV: If our one-off plugins get unwieldy, relocate them to files that export an `init` function
$(function handleReady () {
  // Bind all datepicker inputs
  // http://eternicode.github.io/bootstrap-datepicker/
  // https://bootstrap-datepicker.readthedocs.org/en/latest/index.html
  // TODO: Add component test to verify when we click a new date it changes
  //   and when we return to the original they are the same (verifies moment + component consistency)
  // TODO: Figure out how to do binding on mobile (prob need to use Modernizr or some adapter)
  $('input[type=date]').each(function handleDateInput () {
    var $el = $(this);
    $el.datepicker({
      // Fri Jan 8 2016
      // TODO: Use same length for short months/days as moment in the picker
      format: 'D M d, yyyy',
      todayBtn: 'linked',
      todayHighlight: true
    });
  });
});
