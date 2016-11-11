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
  userProfileURL: config.google.userProfileURL
}, function handlePassportGoogle (accessToken, refreshToken, profile, cb) {
  // DEV: Domains are overkill as this is executed in a controller but we use it for clarity
  // DEV: Sync errors are caught and sent back to `next` handler
  var passportDomain = domain.create();
  passportDomain.on('error', cb);
  passportDomain.run(function handleRun () {
    // profile = {id: '1234', ..., emails: [{value: 'todd@findwork.co', type: 'account'}, ...]}
    // DEV: For full profile info, see `nine-track` recordings
    // DEV: There is only 1 account (main) email per account
    var emails = profile.emails || [];
    var accountEmail = (_.findWhere(emails, {type: 'account'}) || {}).value;

    // If there is no account email, then error out
    // DEV: Error will be sent back to corresponding `next` handler eventually
    if (!accountEmail) {
      return cb(new Error('Unable to resolve email from Google\'s response'));
    }

    // Otherwise, if the candidate exists in our database, return them
    Candidate.find({where: {email: accountEmail}}).asCallback(function handleFind (err, _candidate) {
      // If there was an error, callback with it
      if (err) { return cb(err); }

      // If we have a candidate
      if (_candidate) {
        // Update their access token (refresh token isn't defined for us)
        _candidate.update({google_access_token: accessToken})
            .asCallback(function handleUpdate (err) {
          // If there was an error, send it to Sentry (no need to bail)
          if (err) { app.sentryClient.captureError(err); }

          // Callback with the candidate
          return cb(null, _candidate);
        });
        return;
      }

      // Otherwise, create our candidate
      var candidate = Candidate.build({email: accountEmail, google_access_token: accessToken});
      candidate.save().asCallback(function handleSave (err) {
        // If there was an error, callback with it
        if (err) { return cb(err); }

        // TODO: Send a welcome email to candidate
        // TODO: Should we have any flash message (e.g. Welcome to Find Work!)

        // Callback with our candidate
        cb(null, candidate);
      });
    });
  });
}));

// Define our controllers
// https://github.com/jaredhanson/passport-google-oauth2/tree/v1.0.0#authenticate-requests
// DEV: Scope can be reset during development via
//   https://security.google.com/settings/security/permissions
// DEV: We use a map for different OAuth controllers for different callback URLs
function getOAuthActionController(oauthAction) {
  return passport.authenticate('google', {
    callbackURL: url.format(_.defaults({
      pathname: '/oauth/google/callback',
      query: {action: oauthAction}
    }, config.url.external)),
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
  },
  function redirectAuthenticatedUser (req, res, next) {
    // TODO: Handle redirect strategy... (likely via another URL like `continue-after-auth`)
    //   This is to handle likely split of login and any missing middlewares (e.g. must be admin) for endpoints/actions
    res.redirect('/schedule');
  }
]);
