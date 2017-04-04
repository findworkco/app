// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/topbar', function (suite) {
  // Handle edge case overlay issues
  suite.load('/schedule')
    .setCaptureElements('body')
    .before(function addOverlayHighlights (actions, find) {
      actions.executeJS(function handleExecuteJS (window) {
        // DEV: We only highlight the menu link container as it's absolute positioned
        //   It should not overlap any other elements
        window.document.styleSheets[0].insertRule(
          '#menu-link__container { background: rgba(0, 255, 0, 0.3); }',
          window.document.styleSheets[0].cssRules.length);
      });
    })
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
