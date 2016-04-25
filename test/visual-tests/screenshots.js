// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
// DEV: These tests are for our landing screen screenshots
gemini.suite('screenshots', function (suite) {
  // Capture unaltered large screenshot
  gemini.suite('large', function (suite) {
    suite.setUrl('/application-edit-show.jade')
      .setCaptureElements('body')
      .capture('large', geminiUtils.resizeLarge);
  });

  // Capture small screenshots with minor alterations
  // DEV: We must use multiple suites since `setUrl` seems to apply all captures
  gemini.suite('small-1', function (suite) {
    suite.setUrl('/schedule.jade')
      .setCaptureElements('body')
      .capture('small-1', geminiUtils.resizeSmall);
  });
  gemini.suite('small-2', function (suite) {
    suite.setUrl('/application-edit-show.jade')
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
