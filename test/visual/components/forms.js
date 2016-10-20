// Load in our dependencies
var gemini = require('gemini');
void require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/forms', function (suite) {
  // Navigate to a page with form inputs
  suite.load('/application/abcdef-sky-networks-uuid');

  gemini.suite('input', function (child) {
    // DEV: This verifies we have a clear focus state
    child.skip(); // Skipped due to Gemini poorly capturing box shadow
    var inputSelector = 'input[type=text]';
    child
      .setCaptureElements(inputSelector)
      .capture('default')
      .capture('focus', function hoverEl (actions, find) {
        actions.focus(find(inputSelector));
      });
  });

  gemini.suite('textarea', function (child) {
    // DEV: This verifies we have a clear focus state
    child.skip(); // Skipped due to Gemini poorly capturing box shadow
    var textareaSelector = 'textarea';
    child
      .setCaptureElements(textareaSelector)
      .capture('default')
      .capture('focus', function hoverEl (actions, find) {
        actions.focus(find(textareaSelector));
      });
  });
});
