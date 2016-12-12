// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var HttpError = require('http-errors');
var app = require('../index.js').app;
var config = require('../index.js').config;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var applicationMockData = require('../models/application-mock-data');
var Application = require('../models/application');
var companyMockData = require('../models/company-mock-data');
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

// Define common data loader for nav
app.all('*', function loadNavData (req, res, next) {
  // Define common statuses for all pages
  // TODO: Consider relocating statuses to `app.locals`
  res.locals.APPLICATION_STATUSES = Application.APPLICATION_STATUSES;
  res.locals.APPLICATION_ADD_HUMAN_STATUSES = Application.APPLICATION_ADD_HUMAN_STATUSES;
  res.locals.APPLICATION_EDIT_HUMAN_STATUSES = Application.APPLICATION_EDIT_HUMAN_STATUSES;

  // If our endpoint is exempt (e.g. `/`), then don't load data
  if (['/'].indexOf(req.url) !== -1) {
    return next();
  }

  // If our endpoint isn't GET and non-exempt, then don't load data
  if (req.method !== 'GET' && ['/research-company'].indexOf(req.url) === -1) {
    return next();
  }

  // Set up default timezone
  // TODO: Resolve our user's timezone from IP or their settings
  res.locals.timezone = 'America/Chicago';

  // Define our mock data
  // If the user is logged in, provide mock applications
  // TODO: Conditionally load archived content on archive pages
  //   (may require switching `/application` and `/interview` to `/archive/application` and `/archive/interview`)
  //   We should also make `/application` redirect to `/archive/application` if it's archived and vice versa
  //   (or maybe history.pushState like Trello)
  // TODO: When we add model loading, make this a queued action so we load all models in parallel
  // DEV: We fetch active applications separately so we can add limits to each type
  var archivedApplications, upcomingInterviewApplications, waitingForResponseApplications;
  if (req.candidate) {
    // TODO: Be sure to sort queries by upcoming date
    // TODO: Warn ourselves if we see a date that was before today for upcoming interviews
    archivedApplications = res.locals.archivedApplications = applicationMockData.getArchivedApplications();
    upcomingInterviewApplications = res.locals.upcomingInterviewApplications =
      applicationMockData.getUpcomingInterviewApplications();
    waitingForResponseApplications = res.locals.waitingForResponseApplications =
      applicationMockData.getWaitingForResponseApplications();
    // TODO: Use session data for recently viewed applications
    res.locals.recentlyViewedApplications = [
      upcomingInterviewApplications[0],
      waitingForResponseApplications[0],
      archivedApplications[0]
    ];
  // Otherwise, provide no mock applications
  } else {
    res.locals.archivedApplications = [];
    upcomingInterviewApplications = res.locals.upcomingInterviewApplications = [];
    waitingForResponseApplications = res.locals.waitingForResponseApplications = [];
    res.locals.recentlyViewedApplications = [];
  }

  // Prepare aggregate data
  res.locals.hasActiveApplications = upcomingInterviewApplications.length !== 0 ||
    waitingForResponseApplications.length !== 0;

  // Continue
  next();
});

// Bind our controllers
app.get('/', function rootShow (req, res, next) {
  // If the user is logged in, then redirect them to `/schedule`
  if (req.candidate) {
    res.redirect('/schedule');
  // Otherwise, show the landing page
  } else {
    res.render('landing.jade');
  }
});

function handleAuthError(req, res, next) {
  // If we have a login error, then update our status and send it to the render
  // DEV: We use `req.session` for login errors to prevent errors persisting on page refresh
  var authError = req.session.authError;
  delete req.session.authError;
  if (authError) {
    res.locals.auth_error = authError;
    res.status(400);
  }

  // Continue to next controller
  next();
}
app.get('/login', [
  handleAuthError,
  function loginShow (req, res, next) {
    res.render('login.jade');
  }
]);
app.get('/sign-up', [
  handleAuthError,
  function signUpShow (req, res, next) {
    res.render('sign-up.jade');
  }
]);

app.get('/settings', [
  ensureLoggedIn,
  function settingsShow (req, res, next) {
    res.render('settings.jade', {
      isSettings: true
    });
  }
]);
app.post('/logout', function logoutSave (req, res, next) {
  // Destroy our session
  req.session.destroy(function handleDestroy (err) {
    // If there wasn an error, capture it in a non-failing manner
    // DEV: It's likely the error was talking to Redis but we still want to delete our cookies
    if (err) { req.captureError(err); }

    // Redirect to root
    res.redirect('/');
  });
});
app.post('/delete-account', [
  ensureLoggedIn,
  function deleteAccountSave (req, res, next) {
    // TODO: Destroy our user/cascade destroy applications/interviews
    // Destroy our session
    req.session.destroy(function handleDestroy (err) {
      // If there wasn an error, capture it in a non-failing manner
      // DEV: It's likely the error was talking to Redis but we still want to delete our cookies
      if (err) { req.captureError(err); }

      // Redirect to root
      res.redirect('/');
    });
  }
]);

app.get('/schedule', function scheduleShow (req, res, next) {
  res.render('schedule.jade', {
    // DEV: We use `isSchedule` over direct URL comparisons to allow `/_dev` routes
    isSchedule: true
  });
});
app.get('/archive', function archiveShow (req, res, next) {
  res.render('archive.jade', {
    // DEV: We use `isArchive` over direct URL comparisons to allow `/_dev` routes
    isArchive: true
  });
});

app.get('/research-company', function researchCompanyShow (req, res, next) {
  res.render('research-company-show.jade');
});
app.post('/research-company', function researchCompanySave (req, res, next) {
  // Collect our company research info
  var companyName = req.body.fetch('company_name');
  var renderData = _.extend({
    company_name: companyName
  }, companyMockData.getByName(companyName, true));

  // Render our page
  res.render('research-company-show.jade', renderData);
});

app.get('/add-application', function applicationAddSelectionShow (req, res, next) {
  res.render('application-add-selection-show.jade');
});
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

// TODO: Replace `resolveApplicationById` with all in one loader
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
// TODO: Replace `resolveInterviewById` with all in one loader
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

// Load our OAuth controllers
void require('./oauth-google.js');

// Bind our legal controllers
// DEV: Google OAuth links to these pages
//   https://console.developers.google.com/apis/credentials/consent?project=app-development-144900
//   https://console.developers.google.com/apis/credentials/consent?project=app-production-144901
app.get('/privacy', function privacyShow (req, res, next) {
  res.render('privacy.jade');
});
app.get('/terms', function termsShow (req, res, next) {
  res.render('terms.jade');
});

// Load our development routes
if (config.loadDevelopmentRoutes) {
  void require('./development.js');
}

// Load our error generators and handlers
// DEV: `error-handlers` must go after all other middlewares/controllers to catch their errors
void require('./error-generators.js');
void require('./error-handlers.js');
