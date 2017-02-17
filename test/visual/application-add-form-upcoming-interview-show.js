// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('application-add-form-upcoming-interview-show', function (suite) {
  // DEV: We include nav to make sure we have no links selected
  gemini.suite('default', function (child) {
    child.load('/add-application/upcoming-interview', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function normalizeRelativeValues (actions, find) {
        // Reset date/time inputs to consistent time
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=application_date]').value = '2016-05-19';
          window.document.querySelector('[name=date_time_date]').value = '2022-05-20';
          window.document.querySelector('[name=date_time_time]').value = '7:00PM';
          window.document.querySelector('[name=pre_interview_reminder_date]').value = '2022-05-20';
          window.document.querySelector('[name=pre_interview_reminder_time]').value = '5:00PM';
          window.document.querySelector('[name=post_interview_reminder_date]').value = '2022-05-20';
          window.document.querySelector('[name=post_interview_reminder_time]').value = '9:00PM';
        });
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('invalid', function (child) {
    child.load('/add-application/upcoming-interview', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function normalizeRelativeValues (actions, find) {
        // Reset date/time inputs to consistent time
        // DEV: We use bad pre/post-interview times to get more validation errors
        actions.executeJS(function handleExecuteJS (window) {
          window.document.querySelector('[name=application_date]').value = '2016-05-19';
          window.document.querySelector('[name=date_time_date]').value = '2022-05-20';
          window.document.querySelector('[name=date_time_time]').value = '7:00PM';
          window.document.querySelector('[name=pre_interview_reminder_date]').value = '2016-06-20';
          window.document.querySelector('[name=pre_interview_reminder_time]').value = '5:00PM';
          window.document.querySelector('[name=post_interview_reminder_date]').value = '2016-04-19';
          window.document.querySelector('[name=post_interview_reminder_time]').value = '9:00PM';
        });
      })
      .before(function submitForm (actions, find) {
        actions.click('form[action="/add-application/upcoming-interview"] button[type=submit]');
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('hidden-reminders', function (child) {
    child.load('/add-application/upcoming-interview', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function hideReminders (actions, find) {
        actions.executeJS(function handleExecuteJS (window) {
          // Reset date/time inputs to consistent time
          window.document.querySelector('[name=application_date]').value = '2016-05-19';
          var dateEl = window.document.querySelector('[name=date_time_date]');
          dateEl.value = '2016-01-01';
          window.document.querySelector('[name=date_time_time]').value = '7:00PM';

          // Trigger change event to hide reminders
          var evt = window.document.createEvent('HTMLEvents');
          evt.initEvent('change', true, false);
          dateEl.dispatchEvent(evt);
        });
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
