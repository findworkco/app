// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('terms', function (suite) {
  suite.load('/terms', geminiUtils.SETUPS.LOGGED_OUT)
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
