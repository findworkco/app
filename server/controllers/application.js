// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var HttpError = require('http-errors');
var app = require('../index.js').app;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var applicationMockData = require('../models/application-mock-data');
var companyMockData = require('../models/company-mock-data');
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
app.get('/add-application', [
  function applicationAddSelectionShow (req, res, next) {
    res.render('application-add-selection-show.jade');
  }
]);

function setSaveForLaterStatusKey(req, res, next) {
  res.locals.status_key = 'SAVED_FOR_LATER';
  next();
}
function setWaitingForResponseStatusKey(req, res, next) {
  res.locals.status_key = 'WAITING_FOR_RESPONSE';
  next();
}
function setUpcomingInterviewStatusKey(req, res, next) {
  res.locals.status_key = 'UPCOMING_INTERVIEW';
  next();
}
function setReceivedOfferStatusKey(req, res, next) {
  res.locals.status_key = 'RECEIVED_OFFER';
  next();
}

function applicationAddFormShow(req, res, next) {
  res.render('application-add-form-show.jade', {
    page_url: req.url,
    query_company_name: req.query.get('company_name')
  });
}
function applicationAddFormSave(req, res, next) {
  var mockApplication = mockApplicationsByStatus[res.locals.status_key];
  assert(mockApplication, 'No redirect application found with status key "' + res.locals.status_key + '"');

  // TODO: On save, show "Job application successfully created!" and go to its edit page (if user logged in)
  // jscs:disable maximumLineLength
  // TODO: If user logged out, provide messaging on log in page like: "Sorry, you’ll need an account before we can save the job application. Don’t worry, we will finish saving it when you are done."
  // jscs:enable maximumLineLength
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application saved');
  // TODO: Redirect to saved application
  res.redirect(mockApplication.url);
}

app.get('/add-application/save-for-later', [
  setSaveForLaterStatusKey,
  applicationAddFormShow
]);
app.post('/add-application/save-for-later', [
  ensureLoggedIn,
  setSaveForLaterStatusKey,
  applicationAddFormSave
]);

app.get('/add-application/waiting-for-response', [
  setWaitingForResponseStatusKey,
  applicationAddFormShow
]);
app.post('/add-application/waiting-for-response', [
  ensureLoggedIn,
  setWaitingForResponseStatusKey,
  applicationAddFormSave
]);

app.get('/add-application/upcoming-interview', [
  setUpcomingInterviewStatusKey,
  applicationAddFormShow
]);
app.post('/add-application/upcoming-interview', [
  ensureLoggedIn,
  setUpcomingInterviewStatusKey,
  applicationAddFormSave
]);

app.get('/add-application/received-offer', [
  setReceivedOfferStatusKey,
  applicationAddFormShow
]);
app.post('/add-application/received-offer', [
  ensureLoggedIn,
  setReceivedOfferStatusKey,
  applicationAddFormSave
]);

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
app.get('/application/:id', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationEditShow (req, res, next) {
    var renderData = {selectedApplication: req.application};
    var selectedApplication = renderData.selectedApplication;
    if (selectedApplication.company_name) {
      renderData = _.extend({
        // Placeholder object
      }, companyMockData.getByName(selectedApplication.company_name, false), renderData);
    }
    res.render('application-edit-show.jade', renderData);
  }
]);
// TODO: Move to pattern with multiple functions;
//   retrieve all models `loadModels(function (req, res) { req.models = {a: A.get(1)} })`, update models `(req, res)`,
//   save changes `saveModels`, flash + redirect `(req, res)`
app.post('/application/:id', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationEditSave (req, res, next) {
    // TODO: Update application on save
    var mockApplication = req.application;

    // Notify user of successful save
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');

    // Redirect to the same page to render flash messages and prevent double submissions
    res.redirect(mockApplication.url);
  }
]);

app.post('/application/:id/received-offer', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationRecievedOfferSave (req, res, next) {
    // TODO: Update received offer application
    // var mockApplication = req.application;
    var mockApplication = mockApplicationsByStatus.RECEIVED_OFFER;
    req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
    // req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application status updated to "Offer received"');
    res.redirect(mockApplication.url);
  }
]);

app.post('/application/:id/remove-offer', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationRemoveOfferSave (req, res, next) {
    // TODO: Update application back to waiting for response or upcoming interview
    // var mockApplication = req.application;
    var mockApplication = mockApplicationsByStatus.WAITING_FOR_RESPONSE;
    req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
    res.redirect(mockApplication.url);
  }
]);

app.post('/application/:id/archive', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationArchiveSave (req, res, next) {
    // TODO: Archive `req.application`
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application archived');
    res.redirect('/schedule');
  }
]);

app.post('/application/:id/restore', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationRestoreSave (req, res, next) {
    // TODO: Update application back to any of the non-archived statuses
    // var mockApplication = req.application;
    var mockApplication = mockApplicationsByStatus.WAITING_FOR_RESPONSE;
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application restored');
    res.redirect(mockApplication.url);
  }
]);

app.post('/application/:id/delete', [
  ensureLoggedIn,
  resolveApplicationById,
  function applicationDeleteSave (req, res, next) {
    // TODO: Delete `req.application`
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application deleted');
    res.redirect('/schedule');
  }
]);
