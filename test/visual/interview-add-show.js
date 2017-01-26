// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('interview-add-show', function (suite) {
  // DEV: We include nav to make sure we have selected the proper link
  gemini.suite('default', function (child) {
    child.load('/application/abcdef-sky-networks-uuid/add-interview', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function normalizeRelativeValues (actions, find) {
        // Reset date/time inputs to consistent time
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=date_time_date]').value = '2016-05-20';
          window.document.querySelector('[name=date_time_time]').value = '7:00PM';
          window.document.querySelector('[name=pre_interview_reminder_date]').value = '2016-05-20';
          window.document.querySelector('[name=pre_interview_reminder_time]').value = '5:00PM';
          window.document.querySelector('[name=post_interview_reminder_date]').value = '2016-05-20';
          window.document.querySelector('[name=post_interview_reminder_time]').value = '9:00PM';
        });
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('invalid', function (child) {
    child.load('/application/abcdef-sky-networks-uuid/add-interview', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function normalizeRelativeValuesAndInvalidateForm (actions, find) {
        // Reset date/time inputs to consistent time
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=date_time_date]').value = '2016-05-20';
          window.document.querySelector('[name=date_time_time]').value = '7:00PM';
          window.document.querySelector('[name=pre_interview_reminder_date]').value = '2016-05-20';
          window.document.querySelector('[name=pre_interview_reminder_time]').value = '9:00PM';
          window.document.querySelector('[name=post_interview_reminder_date]').value = '2016-05-20';
          window.document.querySelector('[name=post_interview_reminder_time]').value = '5:00PM';
        });
      })
      .before(function submitForm (actions, find) {
        actions.click('form[action="/application/abcdef-sky-networks-uuid/add-interview"] button[type=submit]');
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
