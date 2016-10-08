// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
gemini.suite('login', function (suite) {
  // DEV: We include nav to make sure we have no link selected
  // TODO: We should not have a logged in state in the nav for the login page
  gemini.suite('default', function (child) {
    child.setUrl('/login')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('error', function (child) {
    child.setUrl('/_dev/login/error')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
