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
      // DEV: This covers both sidebar and top nav
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
    // DEV: Specific selection tests should be done by non-nav tests
    child.setCaptureElements('#nav');

    gemini.suite('selected-link', function (child) {
      // DEV: This verifies we add a left border to selected nav rows
      //   and the leftmost nav style
      child
        .load('/schedule', geminiUtils.SETUPS.DEFAULT)
        .before(expandNav)
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });

    gemini.suite('selected-nested-link', function (child) {
      child
        .load('/add-application', geminiUtils.SETUPS.DEFAULT)
        .before(expandNav)
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });

    gemini.suite('selected-application', function (child) {
      child
        .load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
        .before(expandNav)
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });

    gemini.suite('hover', function (child) {
      // DEV: This verifies we add a left border on hovering a nav row
      child
        .load('/404', geminiUtils.SETUPS.LOGGED_OUT)
        .capture('default')
        .capture('hover', function hoverEl (actions, find) {
          actions.mouseMove(find('.nav-row:not(.nav-row--selected)'));
        });
    });

    gemini.suite('focus', function (child) {
      child
        .load('/404', geminiUtils.SETUPS.LOGGED_OUT)
        .capture('default')
        .capture('focus', function focusEl (actions, find) {
          actions.focus(find('.nav-row:not(.nav-row--selected)'));
        });
    });

    gemini.suite('active', function (child) {
      // DEV: This verifies we outline both link and border
      child
        .load('/404', geminiUtils.SETUPS.LOGGED_OUT)
        .capture('default')
        .capture('active', function focusEl (actions, find) {
          actions.mouseDown(find('a.nav-row'));
        });
    });

    // Edge case: Verify non-hoverable links don't get styled
    gemini.suite('sign-up-hover', function (child) {
      child
        .load('/404', geminiUtils.SETUPS.LOGGED_OUT)
        .capture('hover', function hoverEl (actions, find) {
          actions.mouseMove(find('#nav a[href="/sign-up"]'));
        });
    });
    gemini.suite('logged-in-hover', function (child) {
      child
        .load('/404', geminiUtils.SETUPS.DEFAULT)
        .capture('hover', function hoverEl (actions, find) {
          actions.mouseMove(find('#nav a[href="/settings"]'));
        });
    });
    gemini.suite('logout-hover', function (child) {
      child
        .load('/404', geminiUtils.SETUPS.DEFAULT)
        .capture('hover', function hoverEl (actions, find) {
          actions.mouseMove(find('#nav form[action="/logout"] button'));
        });
    });
  });
});
