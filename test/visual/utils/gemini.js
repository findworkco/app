// Load our dependencies
var _ = require('underscore');
var url = require('url');

// Define common setup configurations
exports.SETUPS = {
  DEFAULT: {
    logged_in: 'true'
  },
  SCREENSHOT: {
    screenshot: 'true'
  }
};

// Define a binding function for custom suite methods
// DEV: `gemini` re-overwrites `gemini.suite` on every file load so we must use a `bind` method in every file
//   https://github.com/gemini-testing/gemini/blob/v3.0.2/lib/test-reader.js#L58
exports.bind = function (gemini) {
  // Extend `gemini.suite` with customizations
  // https://github.com/gemini-testing/gemini/blob/v3.0.2/lib/tests-api/index.js#L7-L40
  var _suite = gemini.suite;
  gemini.suite = function (name, callback) {
    // Create our suite
    _suite.call(this, name, function handleSuite (suite) {
      // Extend our suite
      // DEV: `suite-builder` directly writes new functions so we can do the same
      // https://github.com/gemini-testing/gemini/blob/v3.0.2/lib/tests-api/suite-builder.js
      suite.load = function (redirectUri, options) {
        // If we have no options, use `redirectUri` directly as `setUrl`
        if (!options) {
          options = {};
          suite.setUrl(redirectUri);
        // Otherwise, configure our `/_dev/setup` endpoint
        } else {
          // Resolve our setup URL
          // DEV: We use `options` directly as query string (e.g. `logged_in: true` -> `?logged_in=true`)
          // DEV: This will navigate to `/_dev/setup`, set up session, and redirect to intended page
          //   If we did this without redirect magic, it would be `setUrl` navigating to original page
          //   then we navigate to the page and then navigate back to original page
          // DEV: `gemini.setUrl` will automatically prepend our hostname
          var setupUrl = url.format({
            pathname: '/_dev/setup',
            query: _.defaults({
              redirect_uri: redirectUri
            }, options)
          });

          // Define it as our URL for the suite
          suite.setUrl(setupUrl);
        }

        // If we had a login action, then reset our session by wiping cookies
        // DEV: This is more efficient than using `/logout` as that requires navigation + finding element + clicking
        // https://github.com/gemini-testing/gemini/blob/v3.0.2/lib/tests-api/actions-builder.js#L76-L96
        // https://github.com/gemini-testing/gemini/blob/v3.0.2/lib/browser/index.js#L22-L73
        // https://github.com/admc/wd/blob/v0.4.0/lib/commands.js#L1998-L2010
        if (options.logged_in || options.screenshot) {
          var logout = function (actions, find) {
            // Navigate to settings page for a logout
            actions._pushAction(logout, function logoutFn (browserWrapper) {
              return browserWrapper._browser.deleteAllCookies();
            });
          };
          suite = suite.after(logout);
        }

        // Return our suite for a fluent interface
        return suite;
      };

      // Callback with extended suite
      callback(suite);
    });
  };

  // Return `exports` for a fluent interface
  return exports;
};

// TODO: Move resize helpers directly to methods on `suite-builder`

// Define our resize helpers
// DEV: Despite using a very tall height, we only capture until the body stops
exports.resizeLarge = function (actions, find) {
  actions.setWindowSize(1024, 1600);
};
exports.resizeMedium = function (actions, find) {
  actions.setWindowSize(640, 1600);
};
exports.resizeSmall = function (actions, find) {
  actions.setWindowSize(340, 1600);
};

// DEV: These methods don't work as desired =(
exports.resizeLargeScrollTop = function (actions, find) {
  actions.setWindowSize(1024, 200);
};
exports.resizeMediumScrollTop = function (actions, find) {
  actions.setWindowSize(640, 200);
};
exports.resizeSmallScrollTop = function (actions, find) {
  actions.setWindowSize(340, 200);
};
exports.resizeLargeScrollMiddle = function (actions, find) {
  actions.setWindowSize(1024, 200);
  actions.executeJS(function (window) { window.scroll(0, 200); });
};
exports.resizeMediumScrollMiddle = function (actions, find) {
  actions.setWindowSize(640, 200);
  actions.executeJS(function (window) { window.scroll(0, 200); });
};
exports.resizeSmallScrollMiddle = function (actions, find) {
  actions.setWindowSize(340, 200);
  actions.executeJS(function (window) { window.scroll(0, 200); });
};

// Define a helper to disable CSS transitions
exports.disableTransitions = function (actions, find) {
  actions.executeJS(function handleExecuteJS () {
    // https://github.com/twolfson/css-controls/blob/0.1.1/lib/css-controls.js#L35
    document.styleSheets[0].insertRule('* { transition: none !important; }',
      document.styleSheets[0].cssRules.length);
  });
};
