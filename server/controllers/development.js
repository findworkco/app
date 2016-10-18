// Load in our dependencies
var HttpError = require('http-errors');
var app = require('../index.js').app;
var applicationMockData = require('../models/application-mock-data');
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

// Specific pages and their errors:
app.get('/_dev/login/error', function devLoginErrorShow (req, res, next) {
  // Set an authentication error and redirect to the login page
  req.session.authError = 'Access was denied from Google. Please try again.';
  res.redirect('/login');
});

// Define common mock data binding for dev pages
function handleDevParams(req, res, next) {
  // Set up mock user locals
  // Example usage: `/_dev/schedule?logged_in=true`
  if (req.query.get('logged_in') === 'true') {
    res.locals.candidate = {email: 'dev-user@findwork.test'};
  } else {
    delete res.locals.candidate;
  }

  // If there is a `screenshot` parameter, override more mock data
  if (req.query.get('screenshot') === 'true') {
    res.locals.candidate = {email: 'todd@findwork.co'};
  }

  // Continue to page
  next();
}
// DEV: Used by Gemini to verify sidebar/nav bar logged in state on nav page
app.get('/_dev/schedule', [
  handleDevParams,
  function devScheduleShow (req, res, next) {
    // Render our page with mock data
    res.render('schedule.jade', {
      isSchedule: true
    });
  }
]);

app.get('/_dev/settings', [
  handleDevParams,
  function devSettingsShow (req, res, next) {
    // Render our page with mock data
    res.render('settings.jade', {
      isSettings: true
    });
  }
]);

// DEV: Used by Gemini to verify sidebar/nav bar logged in state on non-nav page
app.get('/_dev/add-application', [
  handleDevParams,
  function devApplicationAddShow (req, res, next) {
    res.render('application-add-show.jade');
  }
]);

// DEV: Used by Gemini to capture home page screenshots
app.get('/_dev/application/:id', [
  handleDevParams,
  function devApplicationEditShow (req, res, next) {
    var mockData = applicationMockData.getById(req.params.id);
    res.render('application-edit-show.jade', mockData);
  }
]);

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
