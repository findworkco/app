// Load in our dependencies
var $ = require('jquery');
var autosizeInput = require('autosize-input');

// When we bind our plugin
exports.init = function () {
  // Find all autosize inputs and bind them
  $('input[data-autosize]').each(function handleAutosizeEl (i, autosizeEl) {
    autosizeInput(autosizeEl);
  });
};
