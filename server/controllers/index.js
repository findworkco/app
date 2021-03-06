// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Sequelize = require('sequelize');
var app = require('../index.js').app;
var config = require('../index.js').config;
var queue = require('../queue');
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var saveModelsViaCandidate = require('../models/utils/save-models').saveModelsViaCandidate;
var applicationMockData = require('../models/application-mock-data');
var Application = require('../models/application');
var includes = require('../models/utils/includes');
var ApplicationReminder = require('../models/application-reminder');
var angellistMockData = require('../models/angellist-mock-data');
var AngelList = require('../models/angellist');
var glassdoorMockData = require('../models/glassdoor-mock-data');
var Glassdoor = require('../models/glassdoor');
var validTimezoneValues = require('../models/base').validTimezoneValues;
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;
assert(validTimezoneValues);

// Define common request configuration
app.all('*', function configureRequest (req, res, next) {
  // If we have a candidate, set the request's timezone to their timezone
  if (req.candidate) {
    req.timezone = res.locals.timezone = req.candidate.get('timezone');
  // Otherwise, resolve their timezone from IP
  } else {
    // Resolve timezone from IP (fallback to US PST)
    // DEV: We can encounter bad geolocation info for development servers
    // {city: {geoname_id: 1111, names: {en: Portland, ...}},
    //  continent: {geoname_id: 2222, code: 'NA', names: {en: 'North America', ...}}
    //  country: {geoname_id: 3333, iso_code: 'US', names: {en: 'United States', ...}}
    //  location: {accuracy_radius: 5, latitude: 45.x, longitude: -122.x,
    //             metro_code: 820, time_zone: 'America/Los_Angeles'},
    //  postal: {code: '97206'},
    //  registered_country: {geoname_id: 4444, iso_code: 'US', names: {en: 'United States', ...}},
    //  subdivisions: [{geoname_id: 5555, iso_code: 'OR', names: {en: 'Oregon', ...}}]}
    var reqGeoInfo = app.maxmindClient.get(req.ip) || {};
    var countryCode = reqGeoInfo.country ? reqGeoInfo.country.iso_code : null;
    var timezone = reqGeoInfo.location ? reqGeoInfo.location.time_zone : null;
    var timezoneValue = countryCode + '-' + timezone;
    if (countryCode && timezone && validTimezoneValues.indexOf(timezoneValue) !== -1) {
      req.timezone = res.locals.timezone = timezoneValue;
    } else {
      req.timezone = res.locals.timezone = 'US-America/Los_Angeles';
    }
  }

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
// Untested convenience page for `/landing` while logged in
app.get('/landing', [
  function landingShow (req, res, next) {
    res.render('landing.jade');
  }
]);

var authShowFns = [
  function handleAuthError (req, res, next) {
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
  },
  function detectAutosubmit (req, res, next) {
    if ((req.session.returnTo && req.session.returnTo.indexOf('autosubmit') !== -1) &&
        req.session.returnRawBody) {
      res.locals.has_return_raw_body = true;
    }
    next();
  },
  resolveModelsAsLocals({nav: true})
];
app.get('/login', _.flatten([
  authShowFns,
  function loginShow (req, res, next) {
    res.render('auth.jade', {
      action: 'login'
    });
  }
]));
app.get('/sign-up', _.flatten([
  authShowFns,
  function signUpShow (req, res, next) {
    res.render('auth.jade', {
      action: 'sign_up'
    });
  }
]));
// /login/email and /sign-up/email can be found in `auth-email.js`

app.get('/settings', [
  ensureLoggedIn,
  resolveModelsAsLocals({nav: true}),
  function settingsShow (req, res, next) {
    res.render('settings.jade', {
      isSettings: true
    });
  }
]);
app.post('/settings', [
  ensureLoggedIn,
  resolveModelsAsLocals({nav: true}),
  function settingsSave (req, res, next) {
    // Update our candidate
    var candidate = req.candidate;
    candidate.set({
      timezone: req.body.fetch('timezone')
    });

    // Save our changes
    saveModelsViaCandidate({models: [candidate], candidate: req.candidate}, next);
  },
  function settingsSaveError (err, req, res, next) {
    // If we have an error and it's a validation error, re-render with it
    if (err instanceof Sequelize.ValidationError) {
      res.status(400).render('settings.jade', {
        form_data: req.body,
        validation_errors: err.errors
      });
      return;
    }

    // Otherwise, callback with our error
    return next(err);
  },
  function settingsSaveSuccess (req, res, next) {
    // Notify user of successful save
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');

    // Redirect to the same page to render flash messages and prevent double submissions
    res.redirect('/settings');
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
    // Save our email to request for reuse on success
    req._email = req.candidate.get('email');

    // Delete our candidate, we will cascade delete its items
    saveModelsViaCandidate({destroyModels: [req.candidate], candidate: req.candidate}, next);
  },
  function deleteAccountSaveSuccess (req, res, next) {
    // Send an account deletion email to candidate
    // DEV: We perform this async as it's non-critical
    assert(req._email);
    queue.create(queue.JOBS.SEND_ACCOUNT_DELETION_EMAIL, {
      email: req._email
    }).save(function handleSendAccountDeletionEmail (err) {
      // If there was an error, send it to Sentry
      if (err) {
        app.sentryClient.captureError(err);
      }
    });

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
    limit: 100
  }, options);
}
function sortApplicationsByTime(applicationA, applicationB) {
  // Attempt to sort by upcoming actions
  // DEV: We want closer upcoming so earlier dates first
  var closestUpcomingMomentA = applicationA.getClosestUpcomingActionMoment();
  var closestUpcomingMomentB = applicationB.getClosestUpcomingActionMoment();
  if (closestUpcomingMomentA && !closestUpcomingMomentB) {
    return -1;
  }
  if (closestUpcomingMomentB && !closestUpcomingMomentA) {
    return 1;
  }
  var diff = (closestUpcomingMomentA || 0) - (closestUpcomingMomentB || 0);
  if (diff !== 0) {
    return diff;
  }

  // Attempt to sort by past actions
  // DEV: We want closer past so later dates first
  var closestPastMomentA = applicationA.getClosestPastActionMoment();
  var closestPastMomentB = applicationB.getClosestPastActionMoment();
  if (closestPastMomentA && !closestPastMomentB) {
    return 1;
  }
  if (closestPastMomentB && !closestPastMomentA) {
    return -1;
  }
  diff = (closestPastMomentB || 0) - (closestPastMomentA || 0);
  if (diff !== 0) {
    return diff;
  }

  // Sort by names
  return applicationA.get('name').localeCompare(applicationB.get('name'));
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
    if (req.models.receivedOfferApplications.length > 90 ||
        req.models.upcomingInterviewApplications.length > 90 ||
        req.models.waitingForResponseApplications.length > 90 ||
        req.models.savedForLaterApplications.length > 90) {
      req.captureError(new Error('Candidate has at least 90 applications of a single type, ' +
        'we should add limits and build "View more" functionality'));
    }

    // Sort our models by time
    // DEV: We should sort models via query but this is easier for now https://trello.com/c/h1K3HEg0/225-sort-schedule-items-by-date
    req.models.receivedOfferApplications.sort(sortApplicationsByTime);
    req.models.upcomingInterviewApplications.sort(sortApplicationsByTime);
    req.models.waitingForResponseApplications.sort(sortApplicationsByTime);
    req.models.savedForLaterApplications.sort(sortApplicationsByTime);

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
    if (req.models.archivedApplications.length > 90) {
      req.captureError(new Error('Candidate has at least 90 archived applications, ' +
        'we should add limits and build "View more" functionality'));
    }

    // Sort our models by time
    // DEV: We should sort models via query but this is easier for now https://trello.com/c/h1K3HEg0/225-sort-schedule-items-by-date
    req.models.archivedApplications.sort(sortApplicationsByTime);

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
      return {
        angelListResult: angellistMockData.getByName(companyName),
        glassdoorResult: glassdoorMockData.getByName(companyName)
      };
    }

    // Return query against company databases
    // DEV: When we add AngelList support, don't load extended content for partial
    return {
      angelListResult: AngelList.searchAsPromise(companyName, req),
      glassdoorResult: Glassdoor.searchAsPromise(companyName, req)
    };
  }),
  function researchCompanySave (req, res, next) {
    var companyName = req.body.fetch('company_name');
    var renderData = {
      company_name: companyName,
      resultsLoaded: true
    };
    if (!req.isPartial) {
      res.render('research-company-show.jade', _.defaults({
        googleAnalyticsEvents: (res.locals.googleAnalyticsEvents || []).concat([{
          category: 'Research company',
          action: 'search',
          label: companyName
        }])
      }, renderData));
    } else {
      res.render('research-company-partial-show.jade', renderData);
    }
  }
]);

// Load application and interview controllers
void require('./application.js');
void require('./interview.js');

// Load our auth and OAuth controllers
void require('./auth-email.js');
void require('./oauth-google.js');

// Bind our legal controllers
// DEV: Google OAuth links to these pages
//   https://console.developers.google.com/apis/credentials/consent?project=app-development-144900
//   https://console.developers.google.com/apis/credentials/consent?project=app-production-144901
app.get('/privacy', [
  // No model resolution as this is a simple redirect
  function privacyShow (req, res, next) {
    res.redirect('https://www.iubenda.com/privacy-policy/8032613');
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
