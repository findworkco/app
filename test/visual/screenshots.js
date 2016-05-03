// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
// DEV: These tests are for our landing screen screenshots
gemini.suite('screenshots', function (suite) {
  // Capture unaltered large screenshot
  gemini.suite('large', function (suite) {
    suite.setUrl('/application/abcdef-sky-networks-uuid')
      .setCaptureElements('body')
      .capture('large', geminiUtils.resizeLarge);
  });

  // Capture medium screenshots
  // DEV: We must use multiple suites since `setUrl` seems to apply all captures
  gemini.suite('medium-1', function (suite) {
    suite.setUrl('/schedule')
      .setCaptureElements('body')
      .capture('medium-1', geminiUtils.resizeMedium);
  });
  gemini.suite('medium-2', function (suite) {
    suite.setUrl('/application/abcdef-sky-networks-uuid')
      .setCaptureElements('body')
      .capture('medium-2', geminiUtils.resizeMedium);
  });

  // Capture small screenshots with minor alterations
  gemini.suite('small-1', function (suite) {
    suite.setUrl('/schedule')
      .setCaptureElements('body')
      .capture('small-1', geminiUtils.resizeSmall);
  });
  gemini.suite('small-2', function (suite) {
    suite.setUrl('/application/abcdef-sky-networks-uuid')
      .setCaptureElements('body')
      .capture('small-2', function handleSmall2Screenshot (actions, find) {
        // Resize our window
        geminiUtils.resizeSmall(actions, find);

        // Shorten the textarea
        actions.executeJS(function handleExecuteJS () {
          document.getElementById('notes').rows = '2';
        });
      });
  });
});
