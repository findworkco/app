// Load in our dependencies
var gemini = require('gemini');
void require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/links', function (suite) {
  // Navigate to a page with links
  var linkSelector = '#content a[href]:not(.btn)';
  suite.load('/application/abcdef-sky-networks-uuid')
    .setCaptureElements(linkSelector)
    .capture('default')
    // DEV: This verifies we add an outline on focus
    .capture('focus', function focusEl (actions, find) {
      actions.focus(find(linkSelector));
    })
    // DEV: This verifies we change color on focus
    .capture('active', function activeEl (actions, find) {
      actions.mouseDown(find(linkSelector));
    });
});
