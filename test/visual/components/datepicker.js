// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/datepicker', function (suite) {
  // Define common variables
  var inputSelector = '#content input[type=date]';
  var popoverSelector = 'body > .datepicker';

  // Navigate to a page with datepicker and verify we see its popover
  gemini.suite('default', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements(popoverSelector)
      .capture('active', function focusEl (actions, find) {
        actions.click(find(inputSelector));
      });
  });

  // Verify we have clear disabled styles
  gemini.suite('disabled-date', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements(popoverSelector)
      .before(function moveNextToDisabledDate (actions, find) {
        actions.executeJS(function handleExecuteJS (window) {
          // DEV: We need to use a separate string variable due to this being in window context
          window.jQuery('#content input[type=date]').datepicker('update', '2020-12-31');
        });
      })
      .capture('active', function focusEl (actions, find) {
        actions.click(find(inputSelector));
      });
  });
});
