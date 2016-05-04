// Load in our dependencies
var _ = require('underscore');
var app = require('../index.js').app;
var layoutMockData = require('./layout-mock-data');
var applicationMockData = require('./application-mock-data');

// Bind our controllers
app.get('/', function rootShow (req, res, next) {
  // TODO: If the user is logged in, then redirect them to `/schedule`
  // Otherwise, show the landing page
  res.render('landing.jade');
});

// TODO: Build static pages /create-application, /application/:id/create-interview, /archived
//   (/application/:id will be used for both active and archived applications)
// TODO: Build stateful pages POST /login?, GET/POST /logout, POST /settings,
//   POST /create-application, POST /application/:id,
//   POST /application/:id/create-interview, POST /interview/:id

app.get('/login', function loginShow (req, res, next) {
  res.render('login.jade', layoutMockData);
});

app.get('/settings', function settingsShow (req, res, next) {
  // TODO: Require login for this page
  res.render('settings.jade', layoutMockData);
});

app.get('/schedule', function scheduleShow (req, res, next) {
  res.render('schedule.jade', layoutMockData);
});

// TODO: Add smoke tests for these and skeletons for form testing but not content
//   We want some flexibility still
app.get('/application/:id', function applicationEditShow (req, res, next) {
  res.render('application-edit-show.jade', applicationMockData);
});

app.get('/interview/:id', function interviewEditShow (req, res, next) {
  res.render('interview-edit-show.jade', _.defaults({
    selectedInterview: applicationMockData.selectedApplication.past_interviews[0]
  }, applicationMockData));
});
