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
  gemini.suite('medium', function (child) {
    child.load('/application/abcdef-google-screenshot-uuid', geminiUtils.SETUPS.SCREENSHOT)
      .setCaptureElements('body')
      .capture('medium', geminiUtils.resizeMedium);
  });

  // Capture small screenshots with minor alterations
  gemini.suite('small', function (child) {
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

          // Remove our reminder info box
          var $reminderInfo = window.jQuery('#waiting_for_response_reminder')
            .closest('.form-group').find('.section--info');
          if (!$reminderInfo.length) { throw new Error('Unable to find reminder info box'); }
          $reminderInfo.remove();
        });
      })
      .capture('small', geminiUtils.resizeSmall);
  });
});
