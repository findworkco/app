// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
// DEV: These tests are for our landing screen screenshots
gemini.suite('screenshots', function (suite) {
  // Capture unaltered large screenshot
  gemini.suite('large', function (child) {
    child.load('/application/abcdef-google-screenshot-uuid', geminiUtils.SETUPS.SCREENSHOT)
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
    child.load('/application/abcdef-google-screenshot-uuid', geminiUtils.SETUPS.SCREENSHOT)
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
    child.load('/application/abcdef-google-screenshot-uuid', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .before(function tweakScreenshot (actions, find) {
        actions.executeJS(function handleExecuteJS (window) {
          // Remove our posting URL and application date for compact screenshot
          var $postingUrlFormGroup = window.jQuery('label[for="posting_url"]').closest('.form-group');
          if (!$postingUrlFormGroup.length) { throw new Error('Unable to find `posting_url` form group'); }
          $postingUrlFormGroup.remove();
          var $applicationDateFormGroup = window.jQuery('label[for="application_date"]').closest('.form-group');
          if (!$applicationDateFormGroup.length) { throw new Error('Unable to find `application_date` form group'); }
          $applicationDateFormGroup.remove();

          // Expand our research company section
          window.jQuery('.research-company [data-toggle]').click();
        });
      })
      .capture('small-2', geminiUtils.resizeSmall);
  });
});
