// Load in our dependencies
var HttpError = require('http-errors');
var app = require('../index.js').app;
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Bind our controllers
// Site-wide bindings:
app.get('/_dev/notification', function devNotificationShow (req, res, next) {
  // Create a notification from our parameters
  var notificationType = req.query.get('type', NOTIFICATION_TYPES.LOG);
  var message = req.query.get('message', '');
  req.flash(notificationType, message);

  // Redirect to a common page
  res.redirect('/schedule');
});

// DEV: We chose this as a gateway for Gemini as opposed to a test server or many endpoints
//   Here is our reasoning: https://gist.github.com/twolfson/ee2714442655ff106cb640ab096cb4a3
//   If we ever want to move to a test server, see: https://trello.com/c/ApF5t4SA/140-explore-using-test-server-for-gemini-instead-of-development-routes
app.get('/_dev/setup', function devSetupShow (req, res, next) {
  // Override current session with mock user info
  // Example usage: `/_dev/schedule?logged_in=true`
  if (req.query.get('logged_in') === 'true') {
    req.session.passport = {user: 'dev-user@findwork.test'};
  }
  if (req.query.get('screenshot') === 'true') {
    req.session.passport = {user: 'todd@findwork.co'};
  }

  // If there's a redirect URI, use it
  var redirectUri = req.query.get('redirect_uri');
  if (redirectUri) {
    // Verify the redirect URI is valid
    if (redirectUri[0] !== '/') {
      return next(new HttpError.BadRequest('Expected redirect URL to be relative (e.g. `/`) but it was not'));
    }
    res.redirect(redirectUri);
  // Otherwise, send a message
  } else {
    res.send('OK');
  }
});

// Specific pages and their errors:
app.get('/_dev/login/error', function devLoginErrorShow (req, res, next) {
  // Set an authentication error and redirect to the login page
  req.session.authError = 'Access was denied from Google. Please try again.';
  res.redirect('/login');
});
app.get('/_dev/sign-up/error', function devSignUpErrorShow (req, res, next) {
  req.session.authError = 'Access was denied from Google. Please try again.';
  res.redirect('/sign-up');
});

// Errors:
// app.get('/_dev/404') is handled by Express not seeing a route

// app.get('/_dev/500') is defined in `server/index.js` to occur before other middlewares
// DEV: This is to emphasize that we might not have user state

app.get('/_dev/missing-query-parameter', function devMissingQueryParameterShow (req, res, next) {
  req.query.fetch('foo');
});

app.get('/_dev/unexposed-error', function devMissingQueryParameterShow (req, res, next) {
  next(new HttpError(400, 'Unexposed error', {expose: false}));
});
