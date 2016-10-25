// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
// TODO: Add corresponding visual tests for other `/add-application` pages
gemini.suite('application-add-save-for-later-show', function (suite) {
  // DEV: We include nav to make sure we have no links selected
  suite.load('/add-application/save-for-later', geminiUtils.SETUPS.DEFAULT)
    .setCaptureElements('body')
    .before(function normalizeRelativeValues (actions, find) {
      // Reset date/time inputs to consistent time
      actions.executeJS(function handleExecuteJS (window) {
        window.document.querySelector('[name=application_reminder_date]').value = '2016-05-20';
        window.document.querySelector('[name=application_reminder_time]').value = '7:00PM';
      });
    })
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
