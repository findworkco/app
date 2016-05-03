// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
gemini.suite('landing', function (suite) {
  suite.setUrl('/')
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
