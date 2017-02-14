// Load in our dependencies
var assert = require('assert');
var $ = require('jquery');

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all content sync inputs and bind them
  $(containerEl).find('input[data-content-sync]').each(function handleAutosizeEl (i, srcEl) {
    // Find our target element
    var targetElSelector = srcEl.getAttribute('data-content-sync');
    var targetEl = containerEl.querySelector(targetElSelector);
    assert(targetEl, 'Unable to find content sync target from selector "' + targetElSelector + '"');

    // Bind to our element's input event (IE >= 9)
    // DEV: Discovered via `autosize-input` library
    //  https://github.com/yuanqing/autosize-input/blob/v0.4.0/autosize-input.js#L72-L75
    // http://caniuse.com/#feat=input-event
    function handleInput(evt) {
      // DEV: We must fallback data, otherwise content could collapse
      //   \xA0 = non-breaking space, normal spaces collapse
      targetEl.textContent = srcEl.value || '\xA0';
    }
    srcEl.addEventListener('input', handleInput);
    handleInput();
  });
};
