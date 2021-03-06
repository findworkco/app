// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('application-add-form-waiting-for-response-show', function (suite) {
  // DEV: We include nav to make sure we have no links selected
  gemini.suite('default', function (child) {
    child.load('/add-application/waiting-for-response', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function normalizeRelativeValues (actions, find) {
        // Reset date/time inputs to consistent time
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=application_date]').value = '2016-05-19';
          window.document.querySelector('[name=waiting_for_response_reminder_date]').value = '2022-05-20';
          window.document.querySelector('[name=waiting_for_response_reminder_time]').value = '7:00PM';
        });
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('invalid', function (child) {
    child.load('/add-application/waiting-for-response', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function normalizeRelativeValues (actions, find) {
        // Reset date/time inputs to consistent time
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=application_date]').value = '2016-05-19';
          window.document.querySelector('[name=waiting_for_response_reminder_date]').value = '2016-05-20';
          window.document.querySelector('[name=waiting_for_response_reminder_time]').value = '7:00PM';
        });
      })
      .before(function submitForm (actions, find) {
        actions.click('form[action="/add-application/waiting-for-response"] button[type=submit]');
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
