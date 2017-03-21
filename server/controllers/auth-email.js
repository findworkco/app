// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var app = require('../index.js').app;
var config = require('../index.js').config;
var queue = require('../queue');
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;

// Bind our controllers
function setAuthActionLogin(req, res, next) {
  res.locals.action = 'login';
  next();
}
function setAuthActionSignUp(req, res, next) {
  res.locals.action = 'sign_up';
  next();
}

// Controllers: /:auth/email/request
var authEmailRequestSaveFns = [
  resolveModelsAsLocals({nav: false}),
  function authEmailRequestShow (req, res, next) {
    // Resolve our action
    var action = res.locals.action;
    assert(action);

    // If we didn't receive an email, then error out to user
    var email = req.body.fetch('email');
    if (!email) {
      req.session.authError = 'No email was provided';
      return res.redirect(action === 'sign_up' ?
        '/sign-up' : '/login');
    }

    // Save our email to the session
    var token = 'ABCDEF123';
    var expiresAt = Date.now() + config.authEmailTimeout;
    req.session.authEmail = email;
    req.session.authEmailToken = token;
    req.session.authEmailExpiresAt = expiresAt;

    // Send an email request to our candidate
    queue.create(queue.JOBS.SEND_AUTH_EMAIL, {
      action: action,
      email: email,
      token: token,
      expiresAt: expiresAt
    }).save(function handleSendAuthEmail (err) {
      // If there was an error, callback with it
      if (err) {
        return next(err);
      }

      // Redirect to token resolve page
      return res.redirect(action === 'sign_up' ?
        '/sign-up/email' : '/login/email');
    });
  }
];
app.post('/login/email/request', _.flatten([
  setAuthActionLogin,
  authEmailRequestSaveFns
]));
app.post('/sign-up/email/request', _.flatten([
  setAuthActionSignUp,
  authEmailRequestSaveFns
]));

// Controllers: /:auth/email (manual entry)
function validateAuthEmailValid(req, res, next) {
  // Resolve our action
  var action = res.locals.action;
  assert(action);

  // If our auth request is invalid or expired
  if (!req.session.authEmail || !req.session.authEmailToken || !req.session.authEmailExpiresAt ||
      req.session.authEmailExpiresAt < Date.now()) {
    // Wipe its contents
    delete req.session.authEmail;
    delete req.session.authEmailToken;
    delete req.session.authEmailExpiresAt;

    // Redirect our user back to their original auth page
    var loggingInStr = action === 'sign_up' ? 'signing up' : 'logging in';
    req.session.authError = 'Email authentication request has expired. Please try ' + loggingInStr + ' again';
    return res.redirect(action === 'sign_up' ? '/sign-up' : '/login');
  }

  // Expose our email and continue
  res.locals.authEmail = req.session.authEmail;
  next();
}
var authEmailShowFns = [
  validateAuthEmailValid,
  resolveModelsAsLocals({nav: true}),
  function authEmailShow (req, res, next) {
    res.render('auth-email.jade', {
      page_url: req.url
    });
  }
];
app.get('/login/email', _.flatten([
  setAuthActionLogin,
  authEmailShowFns
]));
app.get('/sign-up/email', _.flatten([
  setAuthActionSignUp,
  authEmailShowFns
]));
