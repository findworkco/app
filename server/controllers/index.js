// Load in our dependencies
var app = require('../index.js').app;
var applicationMockData = require('../models/application-mock-data');
var interviewMockData = require('../models/interview-mock-data');
var genericMockData = require('../models/generic-mock-data');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Bind our controllers
app.get('/', function rootShow (req, res, next) {
  // TODO: If the user is logged in, then redirect them to `/schedule`
  // Otherwise, show the landing page
  res.render('landing.jade');
});

app.get('/archive', function archiveShow (req, res, next) {
  res.render('archive.jade', genericMockData);
});

// TODO: Build error handlers/pages (e.g. 404, 500)

app.get('/login', function loginShow (req, res, next) {
  res.render('login.jade', genericMockData);
});

app.get('/settings', function settingsShow (req, res, next) {
  // TODO: Require login for this page
  res.render('settings.jade', genericMockData);
});
app.post('/logout', function logoutSave (req, res, next) {
  // TODO: Destroy our session (test me in full)
  res.redirect('/');
});
app.post('/delete-account', function deleteAccountSave (req, res, next) {
  // TODO: Destroy our user/cascade destroy applications/interviews
  // TODO: Destroy out session (test me in full)
  res.redirect('/');
});

app.get('/schedule', function scheduleShow (req, res, next) {
  res.render('schedule.jade', genericMockData);
});

// TODO: Add smoke tests for these and skeletons for form testing but not content
//   We want some flexibility still
app.get('/add-application', function applicationAddShow (req, res, next) {
  res.render('application-add-show.jade', genericMockData);
});
app.post('/add-application', function applicationAddSave (req, res, next) {
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application saved');
  // TODO: Use mock based on status
  res.redirect('/application/abcdef-sky-networks-uuid');
});
app.get('/application/:id', function applicationEditShow (req, res, next) {
  var mockData = applicationMockData.getById(req.params.id);
  res.render('application-edit-show.jade', mockData);
});
// TODO: Move to pattern with multiple functions;
//   retrieve all models `loadModels(function (req, res) { req.models = {a: A.get(1)} })`, update models `(req, res)`,
//   save changes `saveModels`, flash + redirect `(req, res)`
app.post('/application/:id', function applicationEditSave (req, res, next) {
  // Resolve our application
  var mockData = applicationMockData.getById(req.params.id);

  // TODO: Update application on save

  // Notify user of successful save
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');

  // Redirect to the same page to render flash messages and prevent double submissions
  res.redirect(mockData.selectedApplication.url);
});
app.post('/application/:id/received-offer', function applicationOfferRecievedSave (req, res, next) {
  var mockData = applicationMockData.getById(req.params.id);
  req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
  // req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application status updated to "Offer received"');
  res.redirect(mockData.selectedApplication.url);
});
app.post('/application/:id/archive', function applicationArchiveSave (req, res, next) {
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application archived');
  res.redirect('/schedule');
});
app.post('/application/:id/delete', function applicationDeleteSave (req, res, next) {
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application deleted');
  res.redirect('/schedule');
});

app.get('/application/:id/add-interview', function interviewAddShow (req, res, next) {
  var mockData = applicationMockData.getById(req.params.id);
  res.render('interview-add-show.jade', mockData);
});
app.post('/application/:id/add-interview', function interviewAddSave (req, res, next) {
  var mockData = applicationMockData.getById(req.params.id);
  // TODO: Update status if interview is upcoming
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview saved');
  res.redirect(mockData.selectedApplication.url);
});
app.get('/interview/:id', function interviewEditShow (req, res, next) {
  var mockData = interviewMockData.getById(req.params.id);
  res.render('interview-edit-show.jade', mockData);
});
app.post('/interview/:id', function interviewEditSave (req, res, next) {
  var mockData = interviewMockData.getById(req.params.id);
  // TODO: Update applicaiton status if interview is upcoming
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');
  res.redirect(mockData.selectedInterview.url);
});
app.post('/interview/:id/delete', function interviewDeleteSave (req, res, next) {
  var mockData = interviewMockData.getById(req.params.id);
  // TODO: Update applicaiton status if interview was upcoming
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview deleted');
  res.redirect(mockData.selectedApplication.url);
});
