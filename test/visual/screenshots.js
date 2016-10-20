// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
// DEV: These tests are for our landing screen screenshots
gemini.suite('screenshots', function (suite) {
  // Capture unaltered large screenshot
  gemini.suite('large', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .capture('large', geminiUtils.resizeLarge);
  });

  // Capture medium screenshots
  // DEV: We must use multiple suites since `setUrl` applies to all captures
  gemini.suite('medium-1', function (child) {
    child.load('/schedule', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .capture('medium-1', geminiUtils.resizeMedium);
  });
  gemini.suite('medium-2', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .capture('medium-2', geminiUtils.resizeMedium);
  });

  // Capture small screenshots with minor alterations
  gemini.suite('small-1', function (child) {
    child.load('/schedule', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .capture('small-1', geminiUtils.resizeSmall);
  });
  gemini.suite('small-2', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .capture('small-2', geminiUtils.resizeSmall);
  });
});
