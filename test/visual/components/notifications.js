// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('../utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('components/notifications', function (suite) {
  // Disable all transitions
  suite.before(geminiUtils.disableTransitions);

  // Capture 3 color variations
  gemini.suite('color-log', function (child) {
    child.load('/_dev/notification?type=log&message=Hello%20World')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('color-error', function (child) {
    child.load('/_dev/notification?type=error&message=Hello%20World')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('color-success', function (child) {
    child.load('/_dev/notification?type=success&message=Hello%20World')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // Capture 2 scroll positions
  // DEV: Skipped due to window size not working as desired =(
  gemini.suite('scroll-top', function (child) {
    child.skip();
    child.load('/_dev/notification?type=log&message=Hello%20World')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLargeScrollTop)
      .capture('default-medium', geminiUtils.resizeMediumScrollTop)
      .capture('default-small', geminiUtils.resizeSmallScrollTop);
  });
  gemini.suite('scroll-middle', function (child) {
    child.skip();
    child.load('/_dev/notification?type=log&message=Hello%20World')
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLargeScrollMiddle)
      .capture('default-medium', geminiUtils.resizeMediumScrollMiddle)
      .capture('default-small', geminiUtils.resizeSmallScrollMiddle);
  });
});
