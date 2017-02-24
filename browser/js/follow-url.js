// Load in our dependencies
var assert = require('assert');
var $ = require('jquery');

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all follow URL inputs and bind them
  $(containerEl).find('[data-follow-url]').each(function handleFollowUrlEl (i, linkEl) {
    // Find our target element
    var inputElSelector = linkEl.getAttribute('data-follow-url');
    var inputEl = containerEl.querySelector(inputElSelector);
    assert(inputEl, 'Unable to find follow-url target from selector "' + inputElSelector + '"');

    // Bind to our element's input event (IE >= 9)
    // DEV: Discovered via `autosize-input` library
    //   https://github.com/yuanqing/autosize-input/blob/v0.4.0/autosize-input.js#L72-L75
    // http://caniuse.com/#feat=input-event
    function handleInput(evt) {
      linkEl.setAttribute('href', inputEl.value);
    }
    inputEl.addEventListener('input', handleInput);
  });
};
