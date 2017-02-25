// Load in our dependencies
var $ = require('jquery');

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all data confirm submit elements and bind them
  $(containerEl).find('form[data-confirm-submit]').each(function handleEl (i, formEl) {
    // When our form is submitted, launch a confirm dialog
    var confirmText = formEl.getAttribute('data-confirm-submit');
    formEl.addEventListener('submit', function (evt) {
      if (!window.confirm(confirmText)) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    });
  });
};
