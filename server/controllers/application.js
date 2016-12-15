// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var HttpError = require('http-errors');
var app = require('../index.js').app;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
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
  resolveModelsAsLocals({nav: true}),
  function applicationAddSelectionShow (req, res, next) {
    res.render('application-add-selection-show.jade');
  }
]);

function setSaveForLaterStatusKey(req, res, next) {
  req.statusKey = res.locals.status_key = 'SAVED_FOR_LATER';
  next();
}
function setWaitingForResponseStatusKey(req, res, next) {
  req.statusKey = res.locals.status_key = 'WAITING_FOR_RESPONSE';
  next();
}
function setUpcomingInterviewStatusKey(req, res, next) {
  req.statusKey = res.locals.status_key = 'UPCOMING_INTERVIEW';
  next();
}
function setReceivedOfferStatusKey(req, res, next) {
  req.statusKey = res.locals.status_key = 'RECEIVED_OFFER';
  next();
}

var applicationAddFormShowFns = [
  resolveModelsAsLocals({nav: true}),
  function applicationAddFormShow (req, res, next) {
    res.render('application-add-form-show.jade', {
      page_url: req.url,
      query_company_name: req.query.get('company_name')
    });
  }
];
var applicationAddFormSaveFns = [
  // DEV: We resolve `nav` in case of there being a validation error
  resolveModelsAsLocals({nav: true}, function resolveApplicationAddFormSave (req) {
    var mockApplication = mockApplicationsByStatus[req.statusKey];
    assert(mockApplication, 'No redirect application found with status key "' + req.statusKey + '"');
    return {
      mockApplication: mockApplication
    };
  }),
  function applicationAddFormSave (req, res, next) {
    // TODO: On save, show "Job application successfully created!" and go to its edit page (if user logged in)
    // jscs:disable maximumLineLength
    // TODO: If user logged out, provide messaging on log in page like: "Sorry, you’ll need an account before we can save the job application. Don’t worry, we will finish saving it when you are done."
    // jscs:enable maximumLineLength
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application saved');
    // TODO: Redirect to saved application
    res.redirect(req.models.mockApplication.url);
  }
];

app.get('/add-application/save-for-later', _.flatten([
  setSaveForLaterStatusKey,
  applicationAddFormShowFns
]));
app.post('/add-application/save-for-later', _.flatten([
  ensureLoggedIn,
  setSaveForLaterStatusKey,
  applicationAddFormSaveFns
]));

app.get('/add-application/waiting-for-response', _.flatten([
  setWaitingForResponseStatusKey,
  applicationAddFormShowFns
]));
app.post('/add-application/waiting-for-response', _.flatten([
  ensureLoggedIn,
  setWaitingForResponseStatusKey,
  applicationAddFormSaveFns
]));

app.get('/add-application/upcoming-interview', _.flatten([
  setUpcomingInterviewStatusKey,
  applicationAddFormShowFns
]));
app.post('/add-application/upcoming-interview', _.flatten([
  ensureLoggedIn,
  setUpcomingInterviewStatusKey,
  applicationAddFormSaveFns
]));

app.get('/add-application/received-offer', _.flatten([
  setReceivedOfferStatusKey,
  applicationAddFormShowFns
]));
app.post('/add-application/received-offer', _.flatten([
  ensureLoggedIn,
  setReceivedOfferStatusKey,
  applicationAddFormSaveFns
]));

var resolveApplicationById = exports.resolveApplicationById = function (params) {
  return [
    resolveModelsAsLocals(params, function resolveApplicationByIdFn (req) {
      return {
        selectedApplication: applicationMockData.getById(req.params.id)
      };
    }),
    // TODO: Monkey patch a `findOr404` onto `sequelize?
    function verifyApplicationFound (req, res, next) {
      // If we can't find the model, then 404
      if (req.models.selectedApplication === null) {
        return next(new HttpError.NotFound());
      }

      // Otherwise, continue
      next();
    }
  ];
};
app.get('/application/:id', _.flatten([
  ensureLoggedIn,
  resolveApplicationById({nav: true}),
  function applicationEditShow (req, res, next) {
    // TODO: Determine if we want to load company results in series or on page (no way to do it in parallel)
    var selectedApplication = req.models.selectedApplication;
    var renderData = selectedApplication.company_name ?
      companyMockData.getByName(selectedApplication.company_name, false) : {};
    res.render('application-edit-show.jade', renderData);
  }
]));
app.post('/application/:id', _.flatten([
  ensureLoggedIn,
  // DEV: We include nav in case of a validation error
  resolveApplicationById({nav: true}),
  function applicationEditSave (req, res, next) {
    // TODO: Update application on save
    var mockApplication = req.models.selectedApplication;

    // Notify user of successful save
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');

    // Redirect to the same page to render flash messages and prevent double submissions
    res.redirect(mockApplication.url);
  }
]));

app.post('/application/:id/received-offer', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRecievedOfferSave (req, res, next) {
    // TODO: Update received offer application
    // var mockApplication = req.models.selectedApplication;
    var mockApplication = mockApplicationsByStatus.RECEIVED_OFFER;
    req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
    // req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application status updated to "Offer received"');
    res.redirect(mockApplication.url);
  }
]));

app.post('/application/:id/remove-offer', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRemoveOfferSave (req, res, next) {
    // TODO: Update application back to waiting for response or upcoming interview
    // var mockApplication = req.models.selectedApplication;
    var mockApplication = mockApplicationsByStatus.WAITING_FOR_RESPONSE;
    req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
    res.redirect(mockApplication.url);
  }
]));

app.post('/application/:id/archive', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationArchiveSave (req, res, next) {
    // TODO: Archive `req.models.selectedApplication`
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application archived');
    res.redirect('/schedule');
  }
]));

app.post('/application/:id/restore', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRestoreSave (req, res, next) {
    // TODO: Update application back to any of the non-archived statuses
    // var mockApplication = req.models.selectedApplication;
    var mockApplication = mockApplicationsByStatus.WAITING_FOR_RESPONSE;
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application restored');
    res.redirect(mockApplication.url);
  }
]));

app.post('/application/:id/delete', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationDeleteSave (req, res, next) {
    // TODO: Delete `req.models.selectedApplication`
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application deleted');
    res.redirect('/schedule');
  }
]));
