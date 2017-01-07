// Load in our dependencies
var _ = require('underscore');
var async = require('async');
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
var InterviewReminder = require('../models/interview-reminder');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

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
      status: Application.STATUSES[req.statusKey]
    });

    // If our application is saved for later
    var reminder;
    if (req.statusKey === 'SAVED_FOR_LATER') {
      // Create our application's remaining parts (e.g. its reminders)
      // DEV: We avoid nested creation due to no transaction support
      reminder = ApplicationReminder.build({
        candidate_id: req.candidate.get('id'),
        application_id: application.get('id'),
        type: ApplicationReminder.TYPES.SAVED_FOR_LATER,
        is_enabled: req.body.fetchBoolean('saved_for_later_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('saved_for_later_reminder')
      });
      application.set('saved_for_later_reminder_id', reminder.get('id'));

      // Save our models
      saveModels([application, reminder]);
    // Otherwise, if our application is waiting for response
    } else if (req.statusKey === 'WAITING_FOR_RESPONSE') {
      // Update our application and create its remaining parts (e.g. reminders)
      // DEV: We avoid nested creation due to no transaction support
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      reminder = ApplicationReminder.build({
        candidate_id: req.candidate.get('id'),
        application_id: application.get('id'),
        type: ApplicationReminder.TYPES.WAITING_FOR_RESPONSE,
        is_enabled: req.body.fetchBoolean('waiting_for_response_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('waiting_for_response_reminder')
      });
      application.set('waiting_for_response_reminder_id', reminder.get('id'));

      // Save our models
      saveModels([application, reminder]);
    // Otherwise, if our application is upcoming interview
    } else if (req.statusKey === 'UPCOMING_INTERVIEW') {
      // Update our application and create its remaining parts (e.g. reminders)
      // DEV: We avoid nested creation due to no transaction support
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      var interview = Interview.build({
        candidate_id: req.candidate.get('id'),
        application_id: application.get('id'),
        date_time_moment: req.body.fetchMomentTimezone('date_time'),
        details: req.body.fetch('details')
      });
      var preInterviewReminder = InterviewReminder.build({
        candidate_id: req.candidate.get('id'),
        interview_id: interview.get('id'),
        type: InterviewReminder.TYPES.PRE_INTERVIEW,
        is_enabled: req.body.fetchBoolean('pre_interview_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('pre_interview_reminder')
      });
      var postInterviewReminder = InterviewReminder.build({
        candidate_id: req.candidate.get('id'),
        interview_id: interview.get('id'),
        type: InterviewReminder.TYPES.POST_INTERVIEW,
        is_enabled: req.body.fetchBoolean('post_interview_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('post_interview_reminder')
      });
      interview.set('pre_interview_reminder_id', preInterviewReminder.get('id'));
      interview.set('post_interview_reminder_id', postInterviewReminder.get('id'));
      // DEV: We set up relationships for any validation hooks
      // DEV: We are using `setDataValue` as `set` requires `include` to be passed in options
      application.setDataValue('interviews', [interview]);
      preInterviewReminder.setDataValue('interview', interview);
      postInterviewReminder.setDataValue('interview', interview);

      // Save our models
      saveModels([application, interview, preInterviewReminder, postInterviewReminder]);
    // Otherwise, if our application is received offer
    } else if (req.statusKey === 'RECEIVED_OFFER') {
      // Update our application and create its remaining parts (e.g. reminders)
      // DEV: We avoid nested creation due to no transaction support
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      reminder = ApplicationReminder.build({
        candidate_id: req.candidate.get('id'),
        application_id: application.get('id'),
        type: ApplicationReminder.TYPES.RECEIVED_OFFER,
        is_enabled: req.body.fetchBoolean('received_offer_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('received_offer_reminder')
      });
      application.set('received_offer_reminder_id', reminder.get('id'));

      // Save our models
      saveModels([application, reminder]);
    // Otherwise, complain and leave
    } else {
      throw new Error('Unrecognized status type');
    }

    // Define our save handlers
    // TODO: Consider building `req.saveModels` instead of large validation/save/transaction mess
    function saveModels(modelsToSave) { // jshint ignore:line
      // In series
      async.series([
        function validateModels (callback) {
          // Perform all our validations in parallel
          // DEV: If we don't validate all items in parallel, then we will only see first validation error to occur
          async.map(modelsToSave, function validateModel (model, cb) {
            model.validate().asCallback(cb);
          }, function handleResults (err, validationErrResults) {
            // If there was an error, callback with it
            if (err) { return callback(err); }

            // Concatenate all our validation results together
            var validationErrors = [];
            validationErrResults.forEach(function addValidationErrors (validationErrResult) {
              if (validationErrResult) {
                validationErrors = validationErrors.concat(validationErrResult.errors);
              }
            });

            // If we had errors, callback with them
            // https://github.com/sequelize/sequelize/blob/v3.28.0/lib/errors.js#L41-L61
            if (validationErrors.length) {
              return callback(new Sequelize.ValidationError(null, validationErrors));
            }

            // Otherwise, callback
            callback(null);
          });
        },
        function saveModels (callback) {
          app.sequelize.transaction(function handleTransaction (t) {
            return Promise.all(modelsToSave.map(function getSaveQuery (model) {
              return model.save({
                _sourceType: AuditLog.SOURCE_CANDIDATES,
                _sourceId: req.candidate.get('id'),
                transaction: t
              });
            }));
          }).asCallback(callback);
        }
      ], function handleSave (err) {
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
      });
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
    // Define common application options
    // TODO: Consider split load past/upcoming interviews (as well as closest upcoming/past interview for nav)
    var applicationOptions = {
      where: {
        id: req.params.id,
        candidate_id: req.candidate.get('id')
      },
      include: [
        // Past interviews, upcoming interviews, closest upcoming interview, closest past interview (last contact)
        // DEV: We additionally load closest upcoming/past interview for nav reuse
        {model: Interview},
        {model: ApplicationReminder, as: 'saved_for_later_reminder'},
        {model: ApplicationReminder, as: 'waiting_for_response_reminder'},
        {model: ApplicationReminder, as: 'received_offer_reminder'}
      ]
    };

    // If we are loading mock data, return mock data
    if (this.useMocks) {
      return {
        selectedApplicationOr404: applicationMockData.getById(applicationOptions.where.id, applicationOptions)
      };
    }

    // Otherwise, return Sequelize queries
    return {
      selectedApplicationOr404: Application.findOne(applicationOptions)
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
    var mockApplication = req.models.selectedApplication;
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
    var mockApplication = req.models.selectedApplication;
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
    var mockApplication = req.models.selectedApplication;
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
