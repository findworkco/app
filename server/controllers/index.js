// Load in our dependencies
var _ = require('underscore');
var app = require('../index.js').app;
var layoutMockData = require('./layout-mock-data');
var applicationMockData = require('./application-mock-data');

// TODO: Test our endpoints with smoke tests
//   and verify form fields exist where expected

// TODO: Repair double selection in nav by no longer hardcoding selected application
//   It's occuring because we hardcoded 1 selection and recognize the actual selection via URL

// Bind our controllers
app.get('/', function getRoot (req, res, next) {
  // TODO: If the user is logged in, then redirect them to `/schedule`
  // Otherwise, show the landing page
  res.render('landing.jade');
});

// TODO: Build static pages /create-application, /application/:id/create-interview, /archived
//   (/application/:id will be used for both active and archived applications)
// TODO: Build stateful pages POST /login?, GET/POST /logout, POST /settings,
//   POST /create-application, POST /application/:id,
//   POST /application/:id/create-interview, POST /interview/:id

app.get('/login', function getLogin (req, res, next) {
  // TODO: Require logged out for this page
  res.render('login.jade', layoutMockData);
});

app.get('/settings', function getSettings (req, res, next) {
  // TODO: Require login for this page
  res.render('settings.jade', layoutMockData);
});

app.get('/schedule', function getSchedule (req, res, next) {
  res.render('schedule.jade', layoutMockData);
});

app.get('/application/:id', function getApplicationEditShow (req, res, next) {
  res.render('application-edit-show.jade', applicationMockData);
});

app.get('/interview/:id', function getInterviewEditShow (req, res, next) {
  res.render('interview-edit-show.jade', _.defaults({
    selectedInterview: applicationMockData.selectedApplication.past_interviews[0]
  }, applicationMockData));
});
