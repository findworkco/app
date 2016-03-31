// Load in our dependencies
var gemini = require('gemini');

// Define our visual tests
gemini.suite('application-edit-show', function (suite) {
  // DEV: We include nav to make sure we have selected the proper link
  suite.setUrl('/index.jade')
    .setCaptureElements('body')
    .capture('default');
});
