// Load in our dependencies
var gemini = require('gemini');

// Define our visual tests
gemini.suite('components/buttons', function (suite) {
  // Navigate to a page with buttons
  suite.setUrl('/application-edit-show.jade');

  gemini.suite('button', function (child) {
    // DEV: This verifies we have a clear focus state
    // DEV: We don't use nav since it can collapse in small screens
    var btnSelector = '#content .btn.btn--default:not(a):not(.action)';
    child
      .setCaptureElements(btnSelector)
      .capture('default')
      .capture('focus', function hoverEl (actions, find) {
        actions.focus(find(btnSelector));
      });
  });
});
