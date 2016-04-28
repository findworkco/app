// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
gemini.suite('login', function (suite) {
  // DEV: We include nav to make sure we have no link selected
  // TODO: We should not have a logged in state in the nav for the login page
  suite.setUrl('/login.jade')
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge);
});
