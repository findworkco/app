// Load in our dependencies
var _ = require('underscore');
var app = require('../index.js').app;
var config = require('../index.js').config;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var applicationMockData = require('../models/application-mock-data');
var companyMockData = require('../models/company-mock-data');
var interviewMockData = require('../models/interview-mock-data');
var genericMockData = require('../models/generic-mock-data');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Define common data loader for nav
app.get('*', function loadNavData (req, res, next) {
  // Define common statuses for all pages
  res.locals.APPLICATION_STATUSES = genericMockData.APPLICATION_STATUSES;
  res.locals.APPLICATION_HUMAN_STATUSES = genericMockData.APPLICATION_HUMAN_STATUSES;

  // If our endpoint is exempt (e.g. `/`), then don't load data
  if (['/'].indexOf(req.url) !== -1) {
    return next();
  }

  // Define our mock data
  // If the user is logged in, provide mock applications
  // TODO: Conditionally load archived content on archive pages
  //   (may require switching `/application` and `/interview` to `/archive/application` and `/archive/interview`)
  //   We should also make `/application` redirect to `/archive/application` if it's archived and vice versa
  //   (or maybe history.pushState like Trello)
  // TODO: When we add model loading, make this a queued action so we load all models in parallel
  // DEV: We fetch active applications separately so we can add limits to each type
  var upcomingInterviews, waitingForResponseApplications;
  if (req.candidate) {
    res.locals.archivedApplications = genericMockData.archivedApplications;
    upcomingInterviews = res.locals.upcomingInterviews = genericMockData.upcomingInterviews;
    waitingForResponseApplications = res.locals.waitingForResponseApplications =
      genericMockData.waitingForResponseApplications;
  // Otherwise, provide no mock applications
  } else {
    res.locals.archivedApplications = [];
    upcomingInterviews = res.locals.upcomingInterviews = [];
    waitingForResponseApplications = res.locals.waitingForResponseApplications = [];
  }

  // Prepare aggregate data
  res.locals.hasActiveApplications = upcomingInterviews.length !== 0 || waitingForResponseApplications.length !== 0;

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

app.get('/archive', function archiveShow (req, res, next) {
  res.render('archive.jade', {
    // DEV: We use `isArchive` over direct URL comparisons to allow `/_dev` routes
    isArchive: true
  });
});

// TODO: Move to `development` or remove entirely
app.get('/_dev/postgresql', function devPostgresqlShow (req, res, next) {
  // Perform a calculation via PostgreSQL
  // https://github.com/sequelize/sequelize/blob/v3.24.3/lib/sequelize.js#L1076-L1086
  app.postgresqlClient.query('SELECT 1+1 AS sum;', {raw: true, plain: true, logging: null})
      .asCallback(function handleQuery (err, queryResult) {
    // If there was an error, pass it on
    if (err) {
      return next(err);
    }

    // Otherwise, send our result
    //   queryResult = {sum: 2}
    res.send('Sum: ' + queryResult.sum);
  });
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
  // Destroy our session and redirect to the homepage
  req.session.destroy(function handleDestroy (err) {
    // TODO: Handle potential error
    res.redirect('/');
  });
});
app.post('/delete-account', [
  ensureLoggedIn,
  function deleteAccountSave (req, res, next) {
    // TODO: Destroy our user/cascade destroy applications/interviews
    // Destroy out session and redirect to the homepage
    req.session.destroy(function handleDestroy (err) {
      // TODO: Handle potential error
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

// TODO: Add smoke tests for these and skeletons for form testing but not content
//   We want some flexibility still
app.get('/add-application', function applicationAddSelectionShow (req, res, next) {
  res.render('application-add-selection-show.jade');
});
function applicationAddFormShow(req, res, next) {
  res.render('application-add-form-show.jade', {
    pageUrl: req.url
  });
}
function applicationAddFormSave(req, res, next) {
  req.flash(NOTIFICATION_TYPES.SUCCESS, 'Application saved');
  // TODO: Use mock based on status
  res.redirect('/application/abcdef-sky-networks-uuid');
}
app.get('/add-application/save-for-later', [
  applicationAddFormShow
]);
app.post('/add-application/save-for-later', [
  applicationAddFormSave
]);
app.get('/add-application/waiting-for-response', [
  applicationAddFormShow
]);
app.post('/add-application/waiting-for-response', [
  applicationAddFormSave
]);
app.get('/add-application/upcoming-interview', [
  applicationAddFormShow
]);
app.post('/add-application/upcoming-interview', [
  applicationAddFormSave
]);
app.get('/add-application/received-offer', [
  applicationAddFormShow
]);
app.post('/add-application/received-offer', [
  applicationAddFormSave
]);
app.get('/application/:id', function applicationEditShow (req, res, next) {
  var mockData = applicationMockData.getById(req.params.id);
  var selectedApplication = mockData.selectedApplication;
  if (selectedApplication.company_name) {
    mockData = _.extend({
      // Placeholder object
    }, companyMockData.getByName(selectedApplication.company_name, false), mockData);
  }
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
