// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('research-company-show', function (suite) {
  // DEV: We include nav to make sure we have no links selected
  suite.load('/research-company', geminiUtils.SETUPS.DEFAULT)
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
