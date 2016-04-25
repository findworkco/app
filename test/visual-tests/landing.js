// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
gemini.suite('landing', function (suite) {
  suite.setUrl('/landing.jade')
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-small', geminiUtils.resizeSmall);
});
