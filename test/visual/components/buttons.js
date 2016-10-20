// Load in our dependencies
var gemini = require('gemini');
void require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/buttons', function (suite) {
  // Navigate to a page with buttons
  suite.load('/application/abcdef-sky-networks-uuid');

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
