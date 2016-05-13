// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini');

// Define our visual tests
gemini.suite('application-edit-show', function (suite) {
  gemini.suite('active', function (child) {
    // DEV: We include nav to make sure we have selected the proper link
    child.setUrl('/application/abcdef-sky-networks-uuid')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  gemini.suite('archive', function (child) {
    // DEV: We include nav to make sure we have archived nav and selected the proper link
    child.setUrl('/application/abcdef-monstromart-uuid')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
