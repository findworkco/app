// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('application-edit-show', function (suite) {
  gemini.suite('saved-for-later', function (child) {
    // DEV: We include nav to make sure we have selected the proper link
    child.load('/application/abcdef-intertrode-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('upcoming-interview', function (child) {
    // DEV: We include nav to make sure we have selected the proper link
    child.load('/application/abcdef-umbrella-corp-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('waiting-for-response', function (child) {
    // DEV: We include nav to make sure we have selected the proper link
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('archive', function (child) {
    // DEV: We include nav to make sure we have archived nav and selected the proper link
    child.load('/application/abcdef-monstromart-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // One-off visual tests
  // Verify short title has minimum width, doesn't break page, and looks good
  var titleSelector = '#content input[name=name][data-autosize]';
  gemini.suite('short-title', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function setShortTitle (actions, find) {
        // Update our title
        // DEV: `sendKeys` doesn't clear original text so we use `clear` first
        // https://github.com/admc/wd/blob/v0.4.0/lib/element-commands.js#L279-L286
        // https://github.com/gemini-testing/gemini/blob/v4.13.2/lib/tests-api/actions-builder.js#L219-L247
        // https://github.com/gemini-testing/gemini/blob/v4.13.2/lib/tests-api/actions-builder.js#L400-L424
        geminiUtils.clear(actions, titleSelector);
        actions.sendKeys(titleSelector, 'Short');

        // Reset focus to the body
        actions.focus(find('body'));
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // Verify long title has ellipsis, doesn't break floats, and doesn't extend over page
  gemini.suite('long-title', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function setLongTitle (actions, find) {
        // Update our title
        geminiUtils.clear(actions, titleSelector);
        actions.sendKeys(find(titleSelector),
          'Long long long long long long long long long long long long long' +
          'long long long long long long long long long long long long long');

        // Reset focus to the body
        actions.focus(find('body'));
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // Verify listing multiple upcoming/past interviews looks good
  gemini.suite('multiple-upcoming-interviews', function (child) {
    // Skipped due to lack of mock data for now
    child.skip();
    child.load('/application/abcdef-globo-gym-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('multiple-past-interviews', function (child) {
    child.load('/application/abcdef-globo-gym-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('no-upcoming-interviews', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('no-past-interviews', function (child) {
    child.load('/application/abcdef-umbrella-corp-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
