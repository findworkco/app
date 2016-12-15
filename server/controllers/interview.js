// Load in our dependencies
var HttpError = require('http-errors');
var app = require('../index.js').app;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var applicationMockData = require('../models/application-mock-data');
var interviewMockData = require('../models/interview-mock-data');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Define common applications for redirects
var mockApplicationsByStatus = {
  SAVED_FOR_LATER: applicationMockData.getById('abcdef-intertrode-uuid'),
  WAITING_FOR_RESPONSE: applicationMockData.getById('abcdef-sky-networks-uuid'),
  UPCOMING_INTERVIEW: applicationMockData.getById('abcdef-umbrella-corp-uuid'),
  RECEIVED_OFFER: applicationMockData.getById('abcdef-black-mesa-uuid'),
  ARCHIVED: applicationMockData.getById('abcdef-monstromart-uuid')
};

// Define our controllers
// TODO: Replace `resolveApplicationById` with all in one loader
// TODO: Replace `resolveInterviewById` with all in one loader
function resolveApplicationById(req, res, next) {
  // Find our application
  var application = applicationMockData.getById(req.params.id);

  // If we can't find the model, then 404
  if (application === null) {
    return next(new HttpError.NotFound());
  }

  // Otherwise, save it to request and continue
  req.application = application;
  next();
}
function resolveInterviewById(req, res, next) {
  // Find our interview
  var interview = interviewMockData.getById(req.params.id);

  // If we can't find the model, then 404
  if (interview === null) {
    return next(new HttpError.NotFound());
  }

  // Otherwise, save it to request and continue
  req.interview = interview;
  next();
}
app.get('/application/:id/add-interview', [
  ensureLoggedIn,
  resolveApplicationById,
  function interviewAddShow (req, res, next) {
    res.render('interview-add-show.jade', {
      selectedApplication: req.application
    });
  }
]);
app.post('/application/:id/add-interview', [
  ensureLoggedIn,
  resolveApplicationById,
  function interviewAddSave (req, res, next) {
    // TODO: Update status if interview is upcoming
    // var mockApplication = req.application;
    var mockApplication = mockApplicationsByStatus.UPCOMING_INTERVIEW;
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview saved');
    res.redirect(mockApplication.url);
  }
]);

app.get('/interview/:id', [
  ensureLoggedIn,
  resolveInterviewById,
  function interviewEditShow (req, res, next) {
    var mockInterview = req.interview;
    res.render('interview-edit-show.jade', {
      selectedApplication: mockInterview.application,
      selectedInterview: mockInterview
    });
  }
]);
app.post('/interview/:id', [
  ensureLoggedIn,
  resolveInterviewById,
  function interviewEditSave (req, res, next) {
    var mockInterview = req.interview;
    // TODO: Update applicaiton status if interview is upcoming
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');
    res.redirect(mockInterview.url);
  }
]);

app.post('/interview/:id/delete', [
  ensureLoggedIn,
  resolveInterviewById,
  function interviewDeleteSave (req, res, next) {
    var mockInterview = req.interview;
    var mockApplication = mockInterview.application;
    // TODO: Update applicaiton status if interview was upcoming
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview deleted');
    res.redirect(mockApplication.url);
  }
]);
