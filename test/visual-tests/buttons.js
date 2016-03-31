// Load in our dependencies
var gemini = require('gemini');

// Define our visual tests
gemini.suite('buttons', function (suite) {
  // Navigate to a page with buttons
  suite.setUrl('/index.jade');

  gemini.suite('button', function (child) {
    // DEV: This verifies we have a clear focus state
    var btnSelector = '.btn.btn--default';
    child
      .setCaptureElements(btnSelector)
      .capture('default')
      .capture('focus', function hoverEl (actions, find) {
        actions.focus(find(btnSelector));
      });
  });
});
