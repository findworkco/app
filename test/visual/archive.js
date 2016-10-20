// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('archive', function (suite) {
  // DEV: We include nav to make sure we show archived applications and have no links selected
  gemini.suite('empty', function (child) {
    child.load('/archive', geminiUtils.SETUPS.LOGGED_OUT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // DEV: Edge cases are handled by server tests (e.g. logged in with no applications, no other user's applications)
  gemini.suite('non-empty', function (child) {
    child.load('/archive', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
