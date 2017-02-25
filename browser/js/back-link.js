// Load in our dependencies
var $ = require('jquery');

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all back link elements and bind them
  // DEV: This `href` is pulled directly from our mixin -- please use the mixin to prevent one-offs
  $(containerEl).find('a[href="javascript:window.history.go(-1);"]').each(function handleEl (i, linkEl) {
    // When our link is clicked
    linkEl.addEventListener('click', function handleClick (evt) {
      // Stop our default link actions
      // DEV: This stops CSP errors
      evt.preventDefault();

      // Perform custom navigation
      window.history.go(-1);
    });
  });
};
