// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
gemini.suite('application-edit-show', function (suite) {
  // DEV: We include nav to make sure we have selected the proper link
  suite.setUrl('/application-edit-show.jade')
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});