// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/editable-title', function (suite) {
  // Navigate to a page with an editable title
  suite.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT);

  gemini.suite('editable-title', function (child) {
    var inputSelector = '#content .form-control--editable-title';
    child
      .setCaptureElements(inputSelector)
      // Verify we see no border nor box shadow
      .capture('default')
      // Verify we see a border and box shadow
      .capture('focus', function focusEl (actions, find) {
        geminiUtils.disableTransitions(actions, find);
        actions.focus(find(inputSelector));
      });
  });
});
