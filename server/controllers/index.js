// Load in our dependencies
var _ = require('underscore');
var app = require('../index.js').app;
var config = require('../index.js').config;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var applicationMockData = require('../models/application-mock-data');
var Application = require('../models/application');
var includes = require('../models/utils/includes');
var ApplicationReminder = require('../models/application-reminder');
var companyMockData = require('../models/company-mock-data');

// Define common data loader for nav
app.all('*', function loadNavData (req, res, next) {
  // Define common statuses for all pages
  // TODO: Consider relocating statuses to `app.locals`
  res.locals.APPLICATION_STATUSES = Application.STATUSES;
  res.locals.APPLICATION_ADD_HUMAN_STATUSES = Application.ADD_HUMAN_STATUSES;
  res.locals.APPLICATION_EDIT_HUMAN_STATUSES = Application.EDIT_HUMAN_STATUSES;

  // Set up default timezone
  // TODO: Resolve our user's timezone from IP (fallback to US PST) or their settings
  res.locals.timezone = 'US-America/Chicago';

  // Continue
  next();
});

// Bind our controllers
app.get('/', [
  // No models need to be loaded here
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
  resolveModelsAsLocals({nav: true}),
  function loginShow (req, res, next) {
    res.render('login.jade');
  }
]);
app.get('/sign-up', [
  handleAuthError,
  resolveModelsAsLocals({nav: true}),
  function signUpShow (req, res, next) {
    res.render('sign-up.jade');
  }
]);

app.get('/settings', [
  ensureLoggedIn,
  resolveModelsAsLocals({nav: true}),
  function settingsShow (req, res, next) {
    res.render('settings.jade', {
      isSettings: true
    });
  }
]);

app.post('/logout', [
  // No models need to be loaded
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
  // No models need to be loaded
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

// Define common schedule options resolver
function getScheduleOptions(req, status, options) {
  return _.extend({
    where: {
      candidate_id: req.candidate.id,
      status: status
    },
    limit: 20
  }, options);
}
app.get('/schedule', [
  resolveModelsAsLocals({nav: true}, function scheduleShowResolve (req) {
    // If there's no candidate, return nothing
    if (!req.candidate) {
      return {
        receivedOfferApplications: [],
        upcomingInterviewApplications: [],
        waitingForResponseApplications: [],
        savedForLaterApplications: []
      };
    }

    // Populate our options
    // DEV: We fetch active applications separately so we can add limits to each type
    // TODO: Be sure to sort queries by upcoming date
    // TODO: Warn ourselves if we see a date that was before today for upcoming interviews
    var receivedOfferOptions = getScheduleOptions(req, Application.STATUSES.RECEIVED_OFFER, {
      include: [
        includes.closestPastInterview,
        {model: ApplicationReminder, as: 'received_offer_reminder'}
      ]
    });
    var upcomingInterviewOptions = getScheduleOptions(req, Application.STATUSES.UPCOMING_INTERVIEW, {
      include: [includes.closestUpcomingInterview]
    });
    var waitingForResponseOptions = getScheduleOptions(req, Application.STATUSES.WAITING_FOR_RESPONSE, {
      include: [
        includes.closestPastInterview,
        {model: ApplicationReminder, as: 'waiting_for_response_reminder'}
      ]
    });
    var savedForLaterOptions = getScheduleOptions(req, Application.STATUSES.SAVED_FOR_LATER, {
      include: [{model: ApplicationReminder, as: 'saved_for_later_reminder'}]
    });

    // If we are loading mock data, return mock data
    if (this.useMocks) {
      return {
        // DEV: We use hardcoded ids to prevent listing unnecessary content by default
        //   which also makes our mocks more inaccurate of normal user
        receivedOfferApplications: req.query.get('received_offer') === 'true' ?
          applicationMockData.getByIds(['abcdef-black-mesa-uuid'], receivedOfferOptions) : [],
        upcomingInterviewApplications: req.query.get('upcoming_interviews') !== 'false' ?
          applicationMockData.getByIds(
            ['abcdef-umbrella-corp-uuid', 'abcdef-globo-gym-uuid'], upcomingInterviewOptions) : [],
        waitingForResponseApplications: req.query.get('waiting_for_response') !== 'false' ?
          applicationMockData.getByIds(['abcdef-sky-networks-uuid'], waitingForResponseOptions) : [],
        savedForLaterApplications: req.query.get('saved_for_later') === 'true' ?
          applicationMockData.getByIds(['abcdef-intertrode-uuid'], savedForLaterOptions) : []
      };
    }

    // Return Sequelize queries
    return {
      receivedOfferApplications: Application.findAll(receivedOfferOptions),
      upcomingInterviewApplications: Application.findAll(upcomingInterviewOptions),
      waitingForResponseApplications: Application.findAll(waitingForResponseOptions),
      savedForLaterApplications: Application.findAll(savedForLaterOptions)
    };
  }),
  function scheduleShow (req, res, next) {
    // If we have more applications than expected, notify ourselves
    if (req.models.receivedOfferApplications.length > 10 ||
        req.models.upcomingInterviewApplications.length > 10 ||
        req.models.waitingForResponseApplications.length > 10 ||
        req.models.savedForLaterApplications.length > 10) {
      req.captureError(new Error('Candidate has at least 10 applications of a single type, ' +
        'we should add limits and build "View more" functionality'));
    }

    // Render our page
    res.render('schedule.jade');
  }
]);
app.get('/archive', [
  resolveModelsAsLocals({nav: true}, function archiveShowResolve (req) {
    // If there's no candidate, return nothing
    if (!req.candidate) {
      return {archivedApplications: []};
    }

    // If we are loading mock data, return mock data
    var archivedOptions = getScheduleOptions(req, Application.STATUSES.ARCHIVED, {
      include: []
    });
    if (this.useMocks) {
      return {
        archivedApplications: applicationMockData.getByIds(['abcdef-monstromart-uuid'], archivedOptions)
      };
    }

    // Return Sequelize queries
    return {
      archivedApplications: Application.findAll(archivedOptions)
    };
  }),
  function archiveShow (req, res, next) {
    // If we have more applications than expected, notify ourselves
    if (req.models.archivedApplications.length > 10) {
      req.captureError(new Error('Candidate has at least 10 archived applications, ' +
        'we should add limits and build "View more" functionality'));
    }

    // Render our page
    res.render('archive.jade');
  }
]);

app.get('/research-company', [
  resolveModelsAsLocals({nav: true}),
  function researchCompanyShow (req, res, next) {
    res.render('research-company-show.jade');
  }
]);
app.post('/research-company', [
  // DEV: Despite being POST, we still render the page so we need nav models
  resolveModelsAsLocals({nav: true}, function researchCompanySaveResolve (req) {
    // If we loading mock data, return mock data
    var companyName = req.body.fetch('company_name');
    if (this.useMocks) {
      return companyMockData.getByName(companyName, true);
    }

    // Return query against company databases
    return companyMockData.getByName(companyName, true);
  }),
  function researchCompanySave (req, res, next) {
    res.render('research-company-show.jade', {
      company_name: req.body.fetch('company_name')
    });
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
  resolveModelsAsLocals({nav: true}),
  function privacyShow (req, res, next) {
    res.render('privacy.jade');
  }
]);
app.get('/terms', [
  resolveModelsAsLocals({nav: true}),
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
