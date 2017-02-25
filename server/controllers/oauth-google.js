// Load in our dependencies
var domain = require('domain');
var url = require('url');
var _ = require('underscore');
var HttpError = require('http-errors');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var passport = require('passport');
var Candidate = require('../models/candidate');
var app = require('../index.js').app;
var config = require('../index.js').config;
var queue = require('../queue');
var saveModelsViaServer = require('../models/utils/save-models').saveModelsViaServer;

// DEV: Google set up instructions
//   https://developers.google.com/identity/protocols/OAuth2WebServer
//   Be sure to set up OAuth consent screen and enable Google+ API

// Configure our integration with Passport
// https://github.com/jaredhanson/passport-google-oauth2/tree/v1.0.0#configure-strategy
// State validation is enabled via hidden flag
//   https://github.com/jaredhanson/passport-oauth2/issues/28
//   https://github.com/jaredhanson/passport-oauth2/blob/v1.3.0/lib/strategy.js#L102-L103
passport.use(new GoogleStrategy({
  state: true,
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  // callbackURL is configured on each `authenticate` call
  //   https://github.com/jaredhanson/passport-google-oauth2/issues/5#issuecomment-212378963

  // Override URLs for `fakeGoogle` during testing
  authorizationURL: config.google.authorizationURL,
  tokenURL: config.google.tokenURL,
  userProfileURL: config.google.userProfileURL,
  // Explicitly receive `req` in our callback
  // http://stackoverflow.com/a/11784742
  passReqToCallback: true
}, function handlePassportGoogle (req, accessToken, refreshToken, profile, cb) { // jshint ignore:line
  // DEV: Domains are overkill as this is executed in a controller but we use it for clarity
  // DEV: Sync errors are caught and sent back to `next` handler
  var passportDomain = domain.create();
  passportDomain.on('error', cb);
  passportDomain.run(function handleRun () {
    // profile = {id: '1234', ..., emails: [{value: 'todd@findwork.co', type: 'account'}, ...]}
    // DEV: For full profile info, see `nine-track` recordings
    // DEV: There is only 1 account (main) email per account
    var profileEmails = profile.emails || [];
    var accountEmail = (_.findWhere(profileEmails, {type: 'account'}) || {}).value;

    // If there is no account email, then error out
    // DEV: Error will be sent back to corresponding `next` handler eventually
    if (!accountEmail) {
      return next(new Error('Unable to resolve email from Google\'s response'));
    }

    // Otherwise, if the candidate exists in our database, return them
    Candidate.find({where: {email: accountEmail}}).asCallback(function handleFind (err, _candidate) {
      // If there was an error, callback with it
      if (err) { return next(err); }

      // If we have a candidate
      if (_candidate) {
        // Update their access token (refresh token isn't defined for us)
        _candidate.set('google_access_token', accessToken);
        saveModelsViaServer({models: [_candidate]}, function handleUpdate (err) {
          // If there was an error, send it to Sentry (no need to bail)
          if (err) { app.sentryClient.captureError(err); }

          // Callback with the candidate
          return next(null, _candidate);
        });
        return;
      }

      // Otherwise, create our candidate
      var candidate = Candidate.build({
        email: accountEmail,
        google_access_token: accessToken,
        timezone: req.timezone
      });
      saveModelsViaServer({models: [candidate]}, function handleSave (err) {
        // If there was an error, callback with it
        if (err) { return next(err); }

        // Send a welcome email to candidate
        // DEV: We perform this async from candidate creation as it's non-critical
        queue.create(queue.JOBS.SEND_WELCOME_EMAIL, {
          candidateId: candidate.get('id')
        }).save(function handleSendWelcomeEmail (err) {
          // If there was an error, send it to Sentry
          if (err) {
            app.sentryClient.captureError(err);
          }
        });

        // Callback with our candidate
        next(null, candidate);
      });
    });

    function next(err, candidate) { // jshint ignore:line
      // If there was an error, call back with it
      if (err) {
        return cb(err);
      }

      // Regenerate our session to prevent session fixation
      // DEV: Express' session only support fresh regeneration whereas we want data preservation
      var _oldSessionData = _.extendOwn({}, req.session);
      req.session.regenerate(function handleRegenerate (err) {
        // If there was an error, log it
        if (err) {
          app.sentryClient.captureError(err);
        }

        // Call back with our candidate
        _.extend(req.session, _oldSessionData);
        cb(null, candidate);
      });
    }
  });
}));

// Define our controllers
// https://github.com/jaredhanson/passport-google-oauth2/tree/v1.0.0#authenticate-requests
// https://github.com/jaredhanson/connect-ensure-login/tree/v0.1.1#log-in-and-return-to
// https://github.com/jaredhanson/passport/blob/v0.3.2/lib/middleware/authenticate.js#L239-L245
// DEV: Scope can be reset during development via
//   https://security.google.com/settings/security/permissions
// DEV: We use a map for different OAuth controllers for different callback URLs
function getOAuthActionController(oauthAction) {
  return passport.authenticate('google', {
    callbackURL: url.format(_.defaults({
      pathname: '/oauth/google/callback',
      query: {action: oauthAction}
    }, config.url.external)),
    successReturnToOrRedirect: '/schedule',
    scope: config.google.scope
  });
}
var oauthActionControllers = {
  login: getOAuthActionController('login'),
  sign_up: getOAuthActionController('sign_up')
};
var oauthErrorMessages = {
  login: {
    access_denied: 'Access was denied from Google. Please try again.'
  },
  sign_up: {
    access_denied: 'Access was denied from Google. Please try again.'
  }
};
var validOAuthActions = {login: true, sign_up: true};
app.get('/oauth/google/request', [
  function oauthGoogleRequestShow (req, res, next) {
    // Resolve the provided OAuth action
    // DEV: This allows us to redirect to appropriate page on failures
    // DEV: We use `hasOwnProperty` to avoid tricky query parameters like `hasOwnProperty`
    var oauthAction = req.query.fetch('action');
    if (validOAuthActions.hasOwnProperty(oauthAction) === false) {
      return next(new HttpError.BadRequest('Invalid OAuth action provided. Please provide "login" or "sign_up"'));
    }

    // Call the corresponding oauthAction controller
    oauthActionControllers[oauthAction](req, res, next);
  }
]);
app.get('/oauth/google/callback', [
  function oauthGoogleCallbackShow (req, res, next) {
    // If we didn't receive an error or code, then render a 400
    // https://developers.google.com/identity/protocols/OAuth2WebServer#handlingresponse
    if (req.query.get('error') === undefined && req.query.get('code') === undefined) {
      return next(new HttpError.BadRequest('Missing query parameter for "error" and "code". ' +
        'Please provide one of them'));
    }

    // Resolve the provided OAuth action
    // DEV: This allows us to redirect to appropriate page on failures
    // DEV: We use `hasOwnProperty` to avoid tricky query parameters like `hasOwnProperty`
    var oauthAction = req.query.fetch('action');
    if (validOAuthActions.hasOwnProperty(oauthAction) === false) {
      return next(new HttpError.BadRequest('Invalid OAuth action provided. Please provide "login" or "sign_up"'));
    }

    // If we received an error, then redirect to the original page with a matching error
    var errorCode = req.query.get('error');
    if (errorCode !== undefined) {
      var errorMessage = oauthErrorMessages[oauthAction].hasOwnProperty(errorCode) ?
        oauthErrorMessages[oauthAction][errorCode] : ('Error encountered from Google: ' + errorCode);
      req.session.authError = errorMessage;
      return res.redirect(oauthAction === 'sign_up' ? '/sign-up' : '/login');
    }

    // Reset to Express' `req.query` to match `passport's` expectations
    req.query = req._originalQuery;

    // Otherwise, continue to the corresponding controller
    oauthActionControllers[oauthAction](req, res, next);
  }
]);
