// Load in our dependencies
var $ = require('jquery');
var browserInit = require('../../../browser/js/index.js').init;

// Disable transitions for Bootstrap
// https://github.com/twbs/bootstrap/blob/v3.3.7/js/transition.js#L45-L46
// https://github.com/twolfson/multi-image-mergetool/blob/1.32.1/test/browser/utils/application.js#L15-L20
$(function handleReady () {
  $.support.transition = false;
});

// Expose browser init
exports.init = browserInit;
