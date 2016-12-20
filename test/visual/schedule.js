// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('schedule', function (suite) {
  // DEV: We include nav to make sure we have no links selected
  gemini.suite('empty', function (child) {
    child.load('/schedule', geminiUtils.SETUPS.LOGGED_OUT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // DEV: Edge cases are handled by server tests (e.g. logged in with no applications, no other user's applications)
  // DEV: This also tests overflowing notes are wrapped
  gemini.suite('non-empty', function (child) {
    child.load('/schedule', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // Specific application types
  gemini.suite('received-offer', function (child) {
    child.load('/schedule?received_offer=true', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('no-upcoming-interviews', function (child) {
    child.load('/schedule?upcoming_interviews=false', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('no-waiting-for-response', function (child) {
    child.load('/schedule?waiting_for_response=false', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('saved-for-later', function (child) {
    child.load('/schedule?saved_for_later=true', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
