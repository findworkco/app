// Load in our dependencies
var app = require('../index.js').app;
var applicationMockData = require('./application-mock-data');
var interviewMockData = require('./interview-mock-data');
var layoutMockData = require('./layout-mock-data');

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
// TODO: Build error handlers/pages (e.g. 404, 500)

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
  var mockData = applicationMockData.getById(req.params.id);
  res.render('application-edit-show.jade', mockData);
});

app.get('/interview/:id', function interviewEditShow (req, res, next) {
  var mockData = interviewMockData.getById(req.params.id);
  res.render('interview-edit-show.jade', mockData);
});
