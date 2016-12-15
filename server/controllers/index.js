// Load in our dependencies
var _ = require('underscore');
var app = require('../index.js').app;
var config = require('../index.js').config;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var applicationMockData = require('../models/application-mock-data');
var Application = require('../models/application');
var companyMockData = require('../models/company-mock-data');

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
  // TODO: When we add model loading, make this a queued action so we load all models in parallel
  if (req.candidate) {
    // TODO: Use session data for recently viewed applications
    res.locals.recentlyViewedApplications = [
      applicationMockData.getById('abcdef-umbrella-corp-uuid'),
      applicationMockData.getById('abcdef-sky-networks-uuid'),
      applicationMockData.getById('abcdef-monstromart-uuid')
    ];
  // Otherwise, provide no mock applications
  } else {
    res.locals.recentlyViewedApplications = [];
  }

  // Continue
  next();
});

// Bind our controllers
app.get('/', [
  function rootShow (req, res, next) {
    // If the user is logged in, then redirect them to `/schedule`
    if (req.candidate) {
      res.redirect('/schedule');
    // Otherwise, show the landing page
    } else {
      res.render('landing.jade');
    }
  }
]);

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
app.post('/logout', [
    function logoutSave (req, res, next) {
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

app.get('/schedule', [
  function scheduleShow (req, res, next) {
    // DEV: We fetch active applications separately so we can add limits to each type
    // TODO: Be sure to sort queries by upcoming date
    // TODO: Warn ourselves if we see a date that was before today for upcoming interviews
    res.render('schedule.jade', {
      upcomingInterviewApplications: req.candidate ? applicationMockData.getUpcomingInterviewApplications() : [],
      waitingForResponseApplications: req.candidate ? applicationMockData.getWaitingForResponseApplications() : []
    });
  }
]);
app.get('/archive', [
  function archiveShow (req, res, next) {
    res.render('archive.jade', {
      archivedApplications: req.candidate ? applicationMockData.getArchivedApplications() : []
    });
  }
]);

app.get('/research-company', [
  function researchCompanyShow (req, res, next) {
    res.render('research-company-show.jade');
  }
]);
app.post('/research-company', [
  function researchCompanySave (req, res, next) {
    // Collect our company research info
    var companyName = req.body.fetch('company_name');
    var renderData = _.extend({
      company_name: companyName
    }, companyMockData.getByName(companyName, true));

    // Render our page
    res.render('research-company-show.jade', renderData);
  }
]);

// Load application and interview controllers
void require('./application.js');
void require('./interview.js');

// Load our OAuth controllers
void require('./oauth-google.js');

// Bind our legal controllers
// DEV: Google OAuth links to these pages
//   https://console.developers.google.com/apis/credentials/consent?project=app-development-144900
//   https://console.developers.google.com/apis/credentials/consent?project=app-production-144901
app.get('/privacy', [
  function privacyShow (req, res, next) {
    res.render('privacy.jade');
  }
]);
app.get('/terms', [
  function termsShow (req, res, next) {
    res.render('terms.jade');
  }
]);

// Load our development routes
if (config.loadDevelopmentRoutes) {
  void require('./development.js');
}

// Load our error generators and handlers
// DEV: `error-handlers` must go after all other middlewares/controllers to catch their errors
void require('./error-generators.js');
void require('./error-handlers.js');
