// Load in our dependencies
// TODO: Reduce size of jQuery as it's quite large (e.g. remove AJAX)
var $ = require('jquery');
void require('bootstrap-datepicker');
var Modernizr = require('browsernizr');
void require('browsernizr/test/inputtypes');

// TODO: Construct an autosave mechanism for `data-autosave`

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
});
