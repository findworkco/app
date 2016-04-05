// Load in our dependencies
var gemini = require('gemini');

// Define our visual tests
gemini.suite('components/nav', function (suite) {
  suite.setUrl('/application-edit-show.jade');

  gemini.suite('selected-nav-row', function (child) {
    // DEV: This verifies we add a left border to selected nav rows
    child.setCaptureElements('.nav-row--selected').capture('selected');
  });

  gemini.suite('hover-nav-row', function (child) {
    // DEV: This verifies we add a left border on hovering a nav row
    var unselectedRowSelector = '.nav-row:not(.nav-row--selected)';
    child
      .setCaptureElements(unselectedRowSelector)
      .capture('default')
      .capture('hover', function hoverEl (actions, find) {
        actions.mouseMove(find(unselectedRowSelector));
      });
  });

  gemini.suite('focus-nav-row', function (child) {
    // DEV: This verifies we add a left border on focusing a nav link row
    var unselectedLinkRowSelector = 'a.nav-row:not(.nav-row--selected)';
    child
      .setCaptureElements(unselectedLinkRowSelector)
      .capture('default')
      .capture('focus', function focusEl (actions, find) {
        actions.focus(find(unselectedLinkRowSelector));
      });
  });

  gemini.suite('active-nav-row', function (child) {
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
