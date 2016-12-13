// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('../utils/gemini').bind(gemini);

// Define test helpers
function expandNav(actions, find) {
  actions.executeJS(function triggerJQueryNavClick (window) {
    window.jQuery('header button[aria-label="Open menu"]').click();
  });
}

// Define our visual tests
gemini.suite('components/nav', function (suite) {
  gemini.suite('login-status', function (child) {
    gemini.suite('logged-out', function (child) {
      // DEV: On small screens, logo was previously getting squished
      gemini.suite('collapsed', function (child) {
        child.load('/schedule', geminiUtils.SETUPS.LOGGED_OUT)
          .setCaptureElements('body')
          .capture('default-large', geminiUtils.resizeLarge)
          .capture('default-medium', geminiUtils.resizeMedium)
          .capture('default-small', geminiUtils.resizeSmall);
      });
      // DEV: We include `large` in `expanded` to verify no media query regressions are introduced
      //   This has already caught a footer dropping to bottom of page
      gemini.suite('expanded', function (child) {
        child.load('/schedule', geminiUtils.SETUPS.LOGGED_OUT)
          .setCaptureElements('body')
          .before(expandNav)
          .capture('default-large', geminiUtils.resizeLarge)
          .capture('default-medium', geminiUtils.resizeMedium)
          .capture('default-small', geminiUtils.resizeSmall);
      });
    });
    gemini.suite('logged-in', function (child) {
      gemini.suite('collapsed', function (child) {
        child.load('/schedule', geminiUtils.SETUPS.DEFAULT)
          .setCaptureElements('body')
          .capture('default-large', geminiUtils.resizeLarge)
          .capture('default-medium', geminiUtils.resizeMedium)
          .capture('default-small', geminiUtils.resizeSmall);
      });
      // DEV: We include `large` in `expanded` to verify no media query regressions are introduced
      //   This has already caught a footer dropping to bottom of page
      gemini.suite('expanded', function (child) {
        child.load('/schedule', geminiUtils.SETUPS.DEFAULT)
          .setCaptureElements('body')
          .before(expandNav)
          .capture('default-large', geminiUtils.resizeLarge)
          .capture('default-medium', geminiUtils.resizeMedium)
          .capture('default-small', geminiUtils.resizeSmall);
      });
    });
  });

  gemini.suite('nav-row', function (child) {
    // TODO: Restore when we have decided on nav hover implementation (or remove if not)
    child.skip();
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
