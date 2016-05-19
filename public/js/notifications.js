// Load in our dependencies
var $ = require('jquery');
var alertify = require('alertify.js');

// Define constants
var dismissClass = 'alertify-dismiss';
var dismissSelector = '.' + dismissClass;

// When we bind our plugin
exports.init = function () {
  // Configure Alertify
  // https://github.com/alertifyjs/alertify.js/blob/v1.0.11/src/js/alertify.js#L436-L511
  alertify.parent(document.getElementById('notification-container'));
  alertify
    .logPosition('custom right') // Alert position configured via CSS
    .delay(7000) // Show alerts for 7 seconds
    .maxLogItems(5)
    .setLogTemplate(function logTemplate (data) {
      // Verify we are using our custom format
      if (!data || !data.html) {
        throw new Error('Alertify.js uses `innerHTML`, be sure to escape any incoming HTML.' +
          'Once escaped, pass it as an object `{html: escapedHtml}`');
      }

      // Append our alert dismiss button
      return data.html + ' <button type="button" class="' + dismissClass + '" ' +
        'aria-label="Dismiss alert"><i class="fa fa-times"></i></button>';
    });

  // Delegate when someone clicks our close button to close the notification
  $(document).on('click', dismissSelector, function handleDismissClick (evt) {
    // Resolve the parent element and dismiss it via alertify
    // https://github.com/alertifyjs/alertify.js/blob/v1.0.11/src/js/alertify.js#L106-L132
    // DEV: We use a `-1` delay as `0` isn't accepted
    var logEl = this.parentNode;
    alertify._$$alertify.close(logEl, -1);
  });
};
