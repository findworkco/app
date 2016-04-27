// Load in our dependencies
var gemini = require('gemini');

// Define our visual tests
gemini.suite('components/datepicker', function (suite) {
  // Navigate to a page with datepicker
  suite.setUrl('/application-edit-show.jade');

  gemini.suite('datepicker', function (child) {
    // Verify we can see the datepicker popover on click
    var inputSelector = '#content input[type=date]';
    var popoverSelector = 'body > .datepicker';
    child
      .setCaptureElements(popoverSelector)
      .capture('active', function hoverEl (actions, find) {
        actions.click(find(inputSelector));
      });
  });
});