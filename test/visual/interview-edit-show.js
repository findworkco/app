// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('interview-edit-show', function (suite) {
  // DEV: We include nav to make sure we have selected the proper link
  gemini.suite('default', function (child) {
    child.load('/interview/abcdef-sky-networks-interview-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('invalid', function (child) {
    child.load('/interview/abcdef-sky-networks-interview-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function invalidateForm (actions, find) {
        // Reset date/time inputs to consistent time
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=pre_interview_reminder_time]').value = '9:00PM';
          window.document.querySelector('[name=post_interview_reminder_time]').value = '7:00AM';
        });
      })
      .before(function submitForm (actions, find) {
        actions.click('form[action="/interview/abcdef-sky-networks-interview-uuid"] button[type=submit]');
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
