// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/nav', function (suite) {
  // TODO: Restore nav tests when refactor is complete
  suite.skip();
  gemini.suite('login-status', function (child) {
    var navSelector = '#nav';
    gemini.suite('logged-out', function (child) {
      child.load('/schedule', geminiUtils.SETUPS.LOGGED_OUT)
        .setCaptureElements(navSelector)
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
    gemini.suite('logged-in', function (child) {
      child.load('/schedule', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements(navSelector)
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
  });

  gemini.suite('nav-row', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT);

    gemini.suite('selected', function (child) {
      // DEV: This verifies we add a left border to selected nav rows
      child.setCaptureElements('.nav-row--selected').capture('selected');
    });

    gemini.suite('hover', function (child) {
      // DEV: This verifies we add a left border on hovering a nav row
      var unselectedRowSelector = '.nav-row:not(.nav-row--selected)';
      child
        .setCaptureElements(unselectedRowSelector)
        .capture('default')
        .capture('hover', function hoverEl (actions, find) {
          actions.mouseMove(find(unselectedRowSelector));
        });
    });

    gemini.suite('focus', function (child) {
      // DEV: This verifies we add a left border on focusing a nav link row
      var unselectedLinkRowSelector = 'a.nav-row:not(.nav-row--selected)';
      child
        .setCaptureElements(unselectedLinkRowSelector)
        .capture('default')
        .capture('focus', function focusEl (actions, find) {
          actions.focus(find(unselectedLinkRowSelector));
        });
    });

    gemini.suite('active', function (child) {
      // DEV: This verifies we don't color nav links red on active
      var navLinkSelector = 'a.nav-row';
      child
        .setCaptureElements(navLinkSelector)
        .capture('default')
        .capture('active', function focusEl (actions, find) {
          actions.mouseDown(find(navLinkSelector));
        });
    });
  });
});
