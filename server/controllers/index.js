// Load in our dependencies
var _ = require('underscore');
var app = require('../index.js').app;
var config = require('../index.js').config;
var applicationMockData = require('../models/application-mock-data');
var interviewMockData = require('../models/interview-mock-data');
var genericMockData = require('../models/generic-mock-data');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

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
  res.render('archive.jade', _.defaults({
    // DEV: We use `isArchive` over direct URL comparisons to allow `/_dev` routes
    isArchive: true
  }, genericMockData));
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
    res.render('login.jade', genericMockData);
  }
]);
app.get('/sign-up', [
  handleAuthError,
  function signUpShow (req, res, next) {
    res.render('sign-up.jade', genericMockData);
  }
]);

app.get('/settings', function settingsShow (req, res, next) {
  // TODO: Require login for this page
  res.render('settings.jade', _.defaults({
    isSettings: true
  }, genericMockData));
});
app.post('/logout', function logoutSave (req, res, next) {
  // Destroy our session and redirect to the homepage
  req.session.destroy(function handleDestroy (err) {
    // TODO: Handle potential error
    res.redirect('/');
  });
});
app.post('/delete-account', function deleteAccountSave (req, res, next) {
  // TODO: Destroy our user/cascade destroy applications/interviews
  // Destroy out session and redirect to the homepage
  req.session.destroy(function handleDestroy (err) {
    // TODO: Handle potential error
    res.redirect('/');
  });
});

app.get('/schedule', function scheduleShow (req, res, next) {
  res.render('schedule.jade', _.defaults({
    // DEV: We use `isSchedule` over direct URL comparisons to allow `/_dev` routes
    isSchedule: true
  }, genericMockData));
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

// Load our OAuth controllers
void require('./oauth-google.js');

// Bind our legal controllers
// DEV: Google OAuth links to these pages
//   https://console.developers.google.com/apis/credentials/consent?project=app-development-144900
//   https://console.developers.google.com/apis/credentials/consent?project=app-production-144901
app.get('/privacy', function privacyShow (req, res, next) {
  res.render('privacy.jade', genericMockData);
});
app.get('/terms', function termsShow (req, res, next) {
  res.render('terms.jade', genericMockData);
});

// Load our development routes
if (config.loadDevelopmentRoutes) {
  void require('./development.js');
}

// Load our error generators and handlers
// DEV: `error-handlers` must go after all other middlewares/controllers to catch their errors
void require('./error-generators.js');
void require('./error-handlers.js');
