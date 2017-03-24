// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var app = require('../../index.js').app;
var Candidate = require('../../models/candidate');
var queue = require('../../queue');
var saveModelsViaServer = require('../../models/utils/save-models').saveModelsViaServer;
var NOTIFICATION_TYPES = require('../../utils/notifications').TYPES;

// Define our utilities
// DEV: This should be wrapped in a domain whereever we are executing
exports.findOrCreateCandidate = function (params, cb) {
  // Expand our parameters
  var req = params.req; assert(req);
  var whereQuery = params.whereQuery; assert(whereQuery);
  var findWhereTiebreaker = params.findWhereTiebreaker; assert(findWhereTiebreaker);
  var loginInfo = params.loginInfo; assert(loginInfo);
  var signUpInfo = params.signUpInfo; assert(signUpInfo);

  // Attempt to find the candidate in our database
  Candidate.findAll({where: whereQuery, limit: 2}).asCallback(function handleFind (err, _candidates) {
    // If there was an error, callback with it
    if (err) { return next(err); }

    // If we have candidates
    if (_candidates.length) {
      // Find which one to match
      // DEV: This covers case where we have an OR in our where and need to take priority
      // DEV: This could be done via PostgreSQL via `CASE WHEN 1/0` and `ORDER BY` but Sequelize makes it a pain
      var _candidate = _candidates[0];
      if (_candidates.length > 1) {
        _candidate = _.findWhere(_candidates, findWhereTiebreaker);
        assert(_candidate);
      }

      // Update their access token and Google id (refresh token isn't defined for us)
      var loginUpdateAttrs = loginInfo.updateAttrs; assert(loginUpdateAttrs);
      var loginAnalyticsKey = loginInfo.analyticsKey; assert(loginAnalyticsKey);
      _candidate.set(loginUpdateAttrs);
      saveModelsViaServer({models: [_candidate]}, function handleUpdate (err) {
        // If there was an error, send it to Sentry (no need to bail)
        if (err) { app.sentryClient.captureError(err); }

        // Welcome our candidate back via a flash message
        req.flash(NOTIFICATION_TYPES.SUCCESS, 'Welcome back to Find Work!');
        req.googleAnalytics(loginAnalyticsKey);

        // Callback with the candidate
        return next(null, _candidate);
      });
      return;
    }

    // Otherwise, create our candidate
    var signUpCreateAttrs = signUpInfo.createAttrs; assert(signUpCreateAttrs);
    var signUpAnalyticsKey = signUpInfo.analyticsKey; assert(signUpAnalyticsKey);
    var candidate = Candidate.build(_.defaults({
      timezone: req.timezone
    }, signUpCreateAttrs));
    saveModelsViaServer({models: [candidate]}, function handleSave (err) {
      // If there was an error, callback with it
      if (err) { return next(err); }

      // Welcome our candidate via a flash message
      req.flash(NOTIFICATION_TYPES.SUCCESS, 'Welcome to Find Work!');
      req.googleAnalytics(signUpAnalyticsKey);

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
};
