// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('settings', function (suite) {
  // DEV: We include nav to make sure we have selected the proper link
  gemini.suite('default', function (child) {
    child.load('/settings', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('invalid', function (child) {
    child.load('/settings', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function invalidateForm (actions, find) {
        // Add bad timezone option and select it
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=timezone] option').value = 'bad-timezone';
          window.document.querySelector('[name=timezone]').value = 'bad-timezone';
        });
      })
      .before(function submitForm (actions, find) {
        actions.click('form[action="/settings"] button[type=submit]');
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
