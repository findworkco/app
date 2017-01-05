// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Promise = require('bluebird');
var Sequelize = require('sequelize');
var app = require('../index.js').app;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var Application = require('../models/application');
var ApplicationReminder = require('../models/application-reminder');
var applicationMockData = require('../models/application-mock-data');
var AuditLog = require('../models/audit-log');
var companyMockData = require('../models/company-mock-data');
var Interview = require('../models/interview');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Define common applications for redirects
var mockApplicationIdsByStatus = {
  SAVED_FOR_LATER: 'abcdef-intertrode-uuid',
  WAITING_FOR_RESPONSE: 'abcdef-sky-networks-uuid',
  UPCOMING_INTERVIEW: 'abcdef-umbrella-corp-uuid',
  RECEIVED_OFFER: 'abcdef-black-mesa-uuid',
  ARCHIVED: 'abcdef-monstromart-uuid'
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
  resolveModelsAsLocals({nav: true}),
  function applicationAddFormSave (req, res, next) {
    // Create our application to be extended
    var application = Application.build({
      candidate_id: req.candidate.get('id'),
      application_date_moment: null,
      archived_at_moment: null,
      company_name: req.body.fetch('company_name'),
      // TODO: Auto-resolve name if empty -- autoresolve name in a secure fashion (i.e. HTTP/HTTPS only, with timeout)
      name: req.body.fetch('name'),
      notes: req.body.fetch('notes'),
      posting_url: req.body.fetch('posting_url'),
      status: Application.STATUSES.SAVED_FOR_LATER
    });

    // If our application is saved for later
    if (req.statusKey === 'SAVED_FOR_LATER') {
      // Create our application's remaining parts its reminders
      // DEV: We avoid nested creation due to no transaction support
      var reminder = ApplicationReminder.build({
        candidate_id: req.candidate.get('id'),
        application_id: application.get('id'),
        type: ApplicationReminder.TYPES.SAVED_FOR_LATER,
        is_enabled: req.body.fetchBoolean('saved_for_later_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('saved_for_later_reminder')
      });
      application.set('saved_for_later_reminder_id', reminder.get('id'));

      // Save our models
      // TODO: Consider building `req.saveModels` instead of inlining transaction
      //   It will guarantee we always use a transaction by convention so no need to test it
      //   Although we should prob test that saveModels never leaves any orphans on failure
      var modelsToSave = [application, reminder];
      app.sequelize.transaction(function handleTransaction (t) {
        return Promise.all(modelsToSave.map(function getSaveQuery (model) {
          return model.save({
            _sourceType: AuditLog.SOURCE_CANDIDATES,
            _sourceId: req.candidate.get('id'),
            transaction: t
          });
        }));
      }).asCallback(handleSave);
    // Otherwise, use mock behavior
    } else {
      // Find our mock application
      var mockApplicationId = mockApplicationIdsByStatus[req.statusKey];
      assert(mockApplicationId, 'No mock application found with status key "' + req.statusKey + '"');
      application = applicationMockData.getById(mockApplicationId, {include: []});

      // Call our completion logic
      process.nextTick(handleSave);
    }

    // Define our save handler
    function handleSave(err) { // jshint ignore:line
      // If we have an error and it's a validation error, re-render with it
      if (err instanceof Sequelize.ValidationError) {
        res.status(400).render('application-add-form-show.jade', {
          form_data: req.body,
          page_url: req.url,
          validation_errors: err.errors
        });
        return;
      // Otherwise, if we still have an error, callback with it
      } else if (err) {
        return next(err);
      }

      // TODO: On save, show "Job application successfully created!" and go to its edit page (if user logged in)
      // jscs:disable maximumLineLength
      // TODO: If user logged out, provide messaging on log in page like: "Sorry, you’ll need an account before we can save the job application. Don’t worry, we will finish saving it when you are done."
      // jscs:enable maximumLineLength
      req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application saved');
      res.redirect(application.get('url'));
    }
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
  return resolveModelsAsLocals(params, function resolveApplicationByIdFn (req) {
    // If we are loading mock data, return mock data
    // TODO: Consider split load past/upcoming interviews (as well as closest upcoming/past interview for nav)
    var applicationOptions = {
      include: [
        // Past interviews, upcoming interviews, closest upcoming interview, closest past interview (last contact)
        // DEV: We additionally load closest upcoming/past interview for nav reuse
        {model: Interview},
        {model: ApplicationReminder, as: 'saved_for_later_reminder'},
        {model: ApplicationReminder, as: 'waiting_for_response_reminder'},
        {model: ApplicationReminder, as: 'received_offer_reminder'}
      ]
    };
    if (this.useMocks) {
      return {
        selectedApplicationOr404: applicationMockData.getById(req.params.id, applicationOptions)
      };
    }

    // Otherwise, return Sequelize queries
    return {
      selectedApplicationOr404: applicationMockData.getById(req.params.id, applicationOptions)
    };
  });
};
app.get('/application/:id', _.flatten([
  ensureLoggedIn,
  resolveApplicationById({nav: true}),
  function applicationEditShow (req, res, next) {
    // Record our application as recently viewed
    req.addRecentlyViewedApplication(req.models.selectedApplication);

    // TODO: Determine if we want to load company results in series or on page (no way to do it in parallel)
    var selectedApplication = req.models.selectedApplication;
    var companyName = selectedApplication.get('company_name');
    var renderData = companyName ? companyMockData.getByName(companyName, false) : {};
    res.render('application-edit-show.jade', renderData);
  }
]));
app.post('/application/:id', _.flatten([
  ensureLoggedIn,
  // DEV: We include nav in case of a validation error
  resolveApplicationById({nav: true}),
  function applicationEditSave (req, res, next) {
    // TODO: Update application on save
    var application = req.models.selectedApplication;

    // Notify user of successful save
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');

    // Redirect to the same page to render flash messages and prevent double submissions
    res.redirect(application.get('url'));
  }
]));

app.post('/application/:id/received-offer', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRecievedOfferSave (req, res, next) {
    // TODO: Update received offer application
    // var mockApplication = req.models.selectedApplication;
    var mockApplication = applicationMockData.getById(mockApplicationIdsByStatus.RECEIVED_OFFER, {include: []});
    req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
    // req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application status updated to "Offer received"');
    res.redirect(mockApplication.get('url'));
  }
]));

app.post('/application/:id/remove-offer', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRemoveOfferSave (req, res, next) {
    // TODO: Update application back to waiting for response or upcoming interview
    // var mockApplication = req.models.selectedApplication;
    var mockApplication = applicationMockData.getById(mockApplicationIdsByStatus.WAITING_FOR_RESPONSE, {include: []});
    req.flash(NOTIFICATION_TYPES.ERROR, 'Pending implementation');
    res.redirect(mockApplication.get('url'));
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
    var mockApplication = applicationMockData.getById(mockApplicationIdsByStatus.WAITING_FOR_RESPONSE, {include: []});
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application restored');
    res.redirect(mockApplication.get('url'));
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
