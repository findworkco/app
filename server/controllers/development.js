// Load in our dependencies
var HttpError = require('http-errors');
var app = require('../index.js').app;
var emails = require('../emails');
var queue = require('../queue');
var Application = require('../models/application');
var applicationMockData = require('../models/application-mock-data');
var ApplicationReminder = require('../models/application-reminder');
var interviewMockData = require('../models/interview-mock-data');
var InterviewReminder = require('../models/interview-reminder');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Bind our controllers
// Site-wide bindings:
app.get('/_dev/email/test', [
  function devEmailTest (req, res, next) {
    // Send a test email
    emails.test({
      to: 'todd@findwork.co'
    }, {
      url: 'welcome.com'
    }, next);
  },
  function handleSend (req, res, next) {
    res.send('OK');
  }
]);
app.get('/_dev/email/saved-for-later-reminder', [
  function devEmailSavedForLaterReminder (req, res, next) {
    // Send a test email
    emails.savedForLaterReminder({
      to: 'todd@findwork.co'
    }, {
      email: 'todd@findwork.co',
      application: applicationMockData.getById('abcdef-intertrode-uuid')
    }, next);
  },
  function handleSend (req, res, next) {
    res.send('OK');
  }
]);
app.get('/_dev/email/waiting-for-response-reminder', [
  function devEmailWaitingForResponseReminder (req, res, next) {
    // Send a test email
    emails.waitingForResponseReminder({
      to: 'todd@findwork.co'
    }, {
      email: 'todd@findwork.co',
      application: applicationMockData.getById('abcdef-sky-networks-uuid')
    }, next);
  },
  function handleSend (req, res, next) {
    res.send('OK');
  }
]);
app.get('/_dev/email/pre-interview-reminder', [
  function devEmailPreInterviewReminder (req, res, next) {
    // Send a test email
    var interview = interviewMockData.getById('abcdef-umbrella-corp-interview-uuid', {
      include: [
        {model: Application},
        {model: InterviewReminder, as: 'post_interview_reminder'}
      ]
    });
    emails.preInterviewReminder({
      to: 'todd@findwork.co'
    }, {
      email: 'todd@findwork.co',
      application: interview.get('application'),
      interview: interview
    }, next);
  },
  function handleSend (req, res, next) {
    res.send('OK');
  }
]);
app.get('/_dev/email/post-interview-reminder', [
  function devEmailPostInterviewReminder (req, res, next) {
    // Send a test email
    var interview = interviewMockData.getById('abcdef-sky-networks-interview-uuid', {
      include: [{
        model: Application,
        include: [
          {model: ApplicationReminder, as: 'waiting_for_response_reminder'}
        ]
      }]
    });
    emails.postInterviewReminder({
      to: 'todd@findwork.co'
    }, {
      email: 'todd@findwork.co',
      application: interview.get('application'),
      interview: interview
    }, next);
  },
  function handleSend (req, res, next) {
    res.send('OK');
  }
]);
app.get('/_dev/email/received-offer-reminder', [
  function devEmailReceivedOfferReminder (req, res, next) {
    // Send a test email
    emails.receivedOfferReminder({
      to: 'todd@findwork.co'
    }, {
      email: 'todd@findwork.co',
      application: applicationMockData.getById('abcdef-black-mesa-uuid')
    }, next);
  },
  function handleSend (req, res, next) {
    res.send('OK');
  }
]);

app.get('/_dev/email/queue/test', [
  function devEmailQueueTest (req, res, next) {
    // Register our new task
    // https://github.com/Automattic/kue#creating-jobs
    queue.create(queue.JOBS.SEND_TEST_EMAIL, {
      title: 'devQueueTest',
      to: 'todd@findwork.co'
    }).save(next);
  },
  function handleCreate (req, res, next) {
    res.send('OK');
  }
]);

app.get('/_dev/notification', function devNotificationShow (req, res, next) {
  // Create a notification from our parameters
  var notificationType = req.query.get('type', NOTIFICATION_TYPES.LOG);
  var message = req.query.get('message', '');
  req.flash(notificationType, message);

  // Redirect to a common page
  res.redirect('/schedule');
});

// DEV: We chose this as a gateway for Gemini as opposed to a test server or many endpoints
//   Here is our reasoning: https://gist.github.com/twolfson/ee2714442655ff106cb640ab096cb4a3
//   If we ever want to move to a test server, see: https://trello.com/c/ApF5t4SA/140-explore-using-test-server-for-gemini-instead-of-development-routes
app.get('/_dev/setup', function devSetupShow (req, res, next) {
  // If there is a request to use mocks, set it up
  if (req.query.get('use_mocks') === 'true') {
    req.session.useMocks = true;
  }

  // Override current session with mock user info
  // Example usage: `/_dev/schedule?logged_in=true`
  if (req.query.get('logged_in') === 'true') {
    req.session.passport = {user: 'devuser0-0000-0000-0000-000000000000'};
  }
  if (req.query.get('screenshot') === 'true') {
    req.session.passport = {user: 'todd0000-0000-0000-0000-000000000000'};
  }

  // If there is a request for clean CSS, set it up
  if (req.query.get('clean_css')) {
    req.session.cleanCss = req.query.get('clean_css') === 'true';
  }

  // If there is a request to backfill recently viewed applications, set it up
  if (req.query.get('recently_viewed_applications') === 'true') {
    req.session.recentlyViewedApplicationIds = [
      'abcdef-umbrella-corp-uuid',
      'abcdef-sky-networks-uuid',
      'abcdef-monstromart-uuid'
    ];
  }

  // If there's a redirect URI, use it
  var redirectUri = req.query.get('redirect_uri');
  if (redirectUri) {
    // Verify the redirect URI is valid
    if (redirectUri[0] !== '/') {
      return next(new HttpError.BadRequest('Expected redirect URL to be relative (e.g. `/`) but it was not'));
    }
    res.redirect(redirectUri);
  // Otherwise, send a message
  } else {
    res.send('OK');
  }
});

// Specific pages and their errors:
app.get('/_dev/login/error', function devLoginErrorShow (req, res, next) {
  // Set an authentication error and redirect to the login page
  req.session.authError = 'Access was denied from Google. Please try again.';
  res.redirect('/login');
});
app.get('/_dev/sign-up/error', function devSignUpErrorShow (req, res, next) {
  req.session.authError = 'Access was denied from Google. Please try again.';
  res.redirect('/sign-up');
});

// Errors:
// app.get('/_dev/404') is handled by Express not seeing a route

// app.get('/_dev/500') is defined in `server/index.js` to occur before other middlewares
// DEV: This is to emphasize that we might not have user state

app.get('/_dev/missing-query-parameter', function devMissingQueryParameterShow (req, res, next) {
  req.query.fetch('foo');
});

app.get('/_dev/unexposed-error', function devMissingQueryParameterShow (req, res, next) {
  next(new HttpError(400, 'Unexposed error', {expose: false}));
});
