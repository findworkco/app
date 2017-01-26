// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var app = require('../index.js').app;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var saveModelsViaCandidate = require('../models/utils/save-models').saveModelsViaCandidate;
var Application = require('../models/application');
var ApplicationReminder = require('../models/application-reminder');
var applicationMockData = require('../models/application-mock-data');
var companyMockData = require('../models/company-mock-data');
var Interview = require('../models/interview');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Define our controllers
app.get('/add-application', [
  resolveModelsAsLocals({nav: true}),
  function applicationAddSelectionShow (req, res, next) {
    res.render('application-add-selection-show.jade');
  }
]);

function setSaveForLaterApplicationStatus(req, res, next) {
  req.applicationStatus = res.locals.application_status =
    Application.STATUSES.SAVED_FOR_LATER;
  next();
}
function setWaitingForResponseApplicationStatus(req, res, next) {
  req.applicationStatus = res.locals.application_status =
    Application.STATUSES.WAITING_FOR_RESPONSE;
  next();
}
function setUpcomingInterviewApplicationStatus(req, res, next) {
  req.applicationStatus = res.locals.application_status =
    Application.STATUSES.UPCOMING_INTERVIEW;
  next();
}
function setReceivedOfferApplicationStatus(req, res, next) {
  req.applicationStatus = res.locals.application_status =
    Application.STATUSES.RECEIVED_OFFER;
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
    // TODO: If user logged out, redirect to login and provide messaging on log in page like:
    //   "Sorry, you’ll need an account before we can save the job application.
    //    Don’t worry, we will finish saving it when you are done."

    // Create our application to be extended
    var application = req._application = Application.build({
      candidate_id: req.candidate.get('id'),
      application_date_moment: null,
      archived_at_moment: null,
      company_name: req.body.fetch('company_name'),
      // TODO: Auto-resolve name if empty -- autoresolve name in a secure fashion (i.e. HTTP/HTTPS only, with timeout)
      name: req.body.fetch('name'),
      notes: req.body.fetch('notes'),
      posting_url: req.body.fetch('posting_url'),
      status: req.applicationStatus
    });
    application.setDataValue('interviews', []);

    // If our application is saved for later
    var reminder, modelsToSave;
    if (req.applicationStatus === Application.STATUSES.SAVED_FOR_LATER) {
      // Create our application's remaining parts (e.g. its reminders)
      // DEV: We avoid nested creation due to no transaction support
      reminder = application.createSavedForLaterReminder({
        is_enabled: req.body.fetchBoolean('saved_for_later_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('saved_for_later_reminder')
      });

      // Save our models
      saveModels([application, reminder]);
    // Otherwise, if our application is waiting for response
    } else if (req.applicationStatus === Application.STATUSES.WAITING_FOR_RESPONSE) {
      // Update our application and create its remaining parts (e.g. reminders)
      // DEV: We avoid nested creation due to no transaction support
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      reminder = application.createWaitingForResponseReminder({
        is_enabled: req.body.fetchBoolean('waiting_for_response_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('waiting_for_response_reminder')
      });

      // Save our models
      saveModels([application, reminder]);
    // Otherwise, if our application is upcoming interview
    } else if (req.applicationStatus === Application.STATUSES.UPCOMING_INTERVIEW) {
      // Update our application and create its remaining parts (e.g. reminders)
      // DEV: We avoid nested creation due to no transaction support
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      var interview = Interview.build({
        candidate_id: req.candidate.get('id'),
        application_id: application.get('id'),
        date_time_moment: req.body.fetchMomentTimezone('date_time'),
        details: req.body.fetch('details')
      });
      var preInterviewReminder = interview.createPreInterviewReminder({
        is_enabled: req.body.fetchBoolean('pre_interview_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('pre_interview_reminder')
      });
      var postInterviewReminder = interview.createPostInterviewReminder({
        is_enabled: req.body.fetchBoolean('post_interview_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('post_interview_reminder')
      });
      // DEV: We set up relationships for any validation hooks
      // DEV: We are using `setDataValue` as `set` requires `include` to be passed in options
      // DEV: We use `.application` for `interview.application` as we get recursion otherwise
      application.setDataValue('interviews', [interview]);
      interview.application = application;
      preInterviewReminder.setDataValue('interview', interview);
      postInterviewReminder.setDataValue('interview', interview);
      modelsToSave = [application, interview, preInterviewReminder, postInterviewReminder];

      // Handle edge case of interview being in past
      modelsToSave = _.unique(modelsToSave.concat(
        application.updateToInterviewChanges(req)));

      // Save our models
      saveModels(modelsToSave);
    // Otherwise, if our application is received offer
    } else if (req.applicationStatus === Application.STATUSES.RECEIVED_OFFER) {
      // Update our application and create its remaining parts (e.g. reminders)
      // DEV: We avoid nested creation due to no transaction support
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      reminder = application.createReceivedOfferReminder({
        is_enabled: req.body.fetchBoolean('received_offer_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('received_offer_reminder')
      });

      // Save our models
      saveModels([application, reminder]);
    // Otherwise, complain and leave
    } else {
      throw new Error('Unrecognized status type');
    }

    // Define our save handlers
    function saveModels(modelsToSave) { // jshint ignore:line
      saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
    }
  },
  function applicationAddFormSaveError (err, req, res, next) {
    // If we have an error and it's a validation error, re-render with it
    if (err instanceof Sequelize.ValidationError) {
      res.status(400).render('application-add-form-show.jade', {
        form_data: req.body,
        page_url: req.url,
        validation_errors: err.errors
      });
      return;
    }

    // Otherwise, callback with our error
    return next(err);
  },
  function applicationAddFormSaveSuccess (req, res, next) {
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application created');
    res.redirect(req._application.get('url'));
  }
];

app.get('/add-application/save-for-later', _.flatten([
  setSaveForLaterApplicationStatus,
  applicationAddFormShowFns
]));
app.post('/add-application/save-for-later', _.flatten([
  ensureLoggedIn,
  setSaveForLaterApplicationStatus,
  applicationAddFormSaveFns
]));

app.get('/add-application/waiting-for-response', _.flatten([
  setWaitingForResponseApplicationStatus,
  applicationAddFormShowFns
]));
app.post('/add-application/waiting-for-response', _.flatten([
  ensureLoggedIn,
  setWaitingForResponseApplicationStatus,
  applicationAddFormSaveFns
]));

app.get('/add-application/upcoming-interview', _.flatten([
  setUpcomingInterviewApplicationStatus,
  applicationAddFormShowFns
]));
app.post('/add-application/upcoming-interview', _.flatten([
  ensureLoggedIn,
  setUpcomingInterviewApplicationStatus,
  applicationAddFormSaveFns
]));

app.get('/add-application/received-offer', _.flatten([
  setReceivedOfferApplicationStatus,
  applicationAddFormShowFns
]));
app.post('/add-application/received-offer', _.flatten([
  ensureLoggedIn,
  setReceivedOfferApplicationStatus,
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
    // Update our application's common fields
    var application = req.models.selectedApplication;
    application.set({
      company_name: req.body.fetch('company_name'),
      name: req.body.fetch('name'),
      notes: req.body.fetch('notes'),
      posting_url: req.body.fetch('posting_url')
    });

    // If our application is saved for later
    var reminder;
    if (application.get('status') === Application.STATUSES.SAVED_FOR_LATER) {
      reminder = application.updateOrReplaceSavedForLaterReminder({
        is_enabled: req.body.fetchBoolean('saved_for_later_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('saved_for_later_reminder')
      });
      saveModels([application, reminder]);
    // Otherwise, if our application is waiting for response
    } else if (application.get('status') === Application.STATUSES.WAITING_FOR_RESPONSE) {
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      reminder = application.updateOrReplaceWaitingForResponseReminder({
        is_enabled: req.body.fetchBoolean('waiting_for_response_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('waiting_for_response_reminder')
      });
      saveModels([application, reminder]);
    // Otherwise, if our application has an upcoming interview
    } else if (application.get('status') === Application.STATUSES.UPCOMING_INTERVIEW) {
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      // No reminders to update for upcoming interview on application page
      saveModels([application]);
    // Otherwise, if our application has received an offer
    } else if (application.get('status') === Application.STATUSES.RECEIVED_OFFER) {
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      reminder = application.updateOrReplaceReceivedOfferReminder({
        is_enabled: req.body.fetchBoolean('received_offer_reminder_enabled'),
        date_time_moment: req.body.fetchMomentTimezone('received_offer_reminder')
      });
      saveModels([application, reminder]);
    // Otherwise, if our application is archived
    } else if (application.get('status') === Application.STATUSES.ARCHIVED) {
      application.set('application_date_moment', req.body.fetchMomentDateOnly('application_date'));
      // No reminders to update for archived applications
      saveModels([application]);
    // Otherwise, complain and leave
    } else {
      throw new Error('Unrecognized status type');
    }

    // Define our save handlers
    function saveModels(modelsToSave) { // jshint ignore:line
      saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
    }
  },
  function applicationEditSaveError (err, req, res, next) {
    // If we have an error and it's a validation error, re-render with it
    if (err instanceof Sequelize.ValidationError) {
      res.status(400).render('application-edit-show.jade', {
        form_data: req.body,
        validation_errors: err.errors
      });
      return;
    }

    // Otherwise, callback with our error
    return next(err);
  },
  function applicationEditSaveSuccess (req, res, next) {
    // Notify user of successful save
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');

    // Redirect to the same page to render flash messages and prevent double submissions
    res.redirect(req.models.selectedApplication.get('url'));
  }
]));

app.post('/application/:id/applied', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationAppliedSave (req, res, next) {
    // Update our model
    var application = req.models.selectedApplication;
    var modelsToSave = application.updateToApplied(req);

    // Save our changes
    saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
  },
  function applicationAppliedSaveSuccess (req, res, next) {
    // Notify user of success
    req.flash(NOTIFICATION_TYPES.SUCCESS,
      'Application updated to "' + Application.EDIT_HUMAN_STATUSES.WAITING_FOR_RESPONSE + '"');
    res.redirect(req.models.selectedApplication.get('url'));
  }
]));

app.post('/application/:id/received-offer', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRecievedOfferSave (req, res, next) {
    // Update our model
    var application = req.models.selectedApplication;
    var modelsToSave = application.updateToReceivedOffer(req);

    // Save our changes
    saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
  },
  function applicationRecievedOfferSaveSuccess (req, res, next) {
    // Notify user of success
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application updated to "Received offer"');
    res.redirect(req.models.selectedApplication.get('url'));
  }
]));

app.post('/application/:id/remove-offer', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRemoveOfferSave (req, res, next) {
    // Update our model and save
    var application = req.models.selectedApplication;
    var modelsToSave = application.updateToRemoveOffer(req);

    // Save our models
    saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
  },
  function applicationRemoveOfferSaveSuccess (req, res, next) {
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Removed offer from application');
    res.redirect(req.models.selectedApplication.get('url'));
  }
]));

app.post('/application/:id/archive', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationArchiveSave (req, res, next) {
    // Update our model and save
    var application = req.models.selectedApplication;
    var modelsToSave = application.updateToArchived(req);
    saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
  },
  function applicationArchiveSaveSuccess (req, res, next) {
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application archived');
    res.redirect('/schedule');
  }
]));

app.post('/application/:id/restore', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationRestoreSave (req, res, next) {
    // Update our model and save
    var application = req.models.selectedApplication;
    var modelsToSave = application.updateToRestore(req);
    saveModelsViaCandidate({models: modelsToSave, candidate: req.candidate}, next);
  },
  function applicationRestoreSaveSuccess (req, res, next) {
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application restored');
    res.redirect(req.models.selectedApplication.get('url'));
  }
]));

app.post('/application/:id/delete', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveApplicationById({nav: false}),
  function applicationDeleteSave (req, res, next) {
    // Delete our model
    var application = req.models.selectedApplication;
    saveModelsViaCandidate({destroyModels: [application], candidate: req.candidate}, next);
  },
  function applicationDeleteSaveSuccess (req, res, next) {
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application deleted');
    res.redirect('/schedule');
  }
]));
