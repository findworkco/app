// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var applicationMockData = require('../models/application-mock-data');

// TODO: Move to pattern with multiple functions;
//   retrieve all models `loadModels(function (req, res) { req.models = {a: A.get(1)} })`,
//   update models `(req, res)`,
//   save changes `saveModels`, flash + redirect `(req, res)`

// Define our middleware
// DEV: We considered this against a wrapper around Express routes (e.g. `routes.get`)
//   We chose a standalone middleware so we can place it as needed (e.g. after `ensureLoggedIn` )
//   and we don't essentially wind up rewriting middleware support under a bespoke API
function noop() {}
exports.resolveModelsAsLocals = function (params, resolver) {
  // Require parameters (including nav setting) to enforce convention
  assert(params, '`resolveModelsAsLocals` expected `params` but received none. Please provide one');
  assert.notEqual(params.nav, undefined,
   '`resolveModelsAsLocals` expected `params.nav` but be defined but it wasn\'t. Please set `params.nav`');

  // Fallback our options
  resolver = resolver || noop;

  // Return our resolver middleware
  return function resolveModelsAsLocalsFn (req, res, next) {
    // Define our models base
    // DEV: When we move to Sequelize, we will load from a promise via `.asCallback()` and update the object
    var models = {};

    // If we want to load nav content
    if (params.nav !== false) {
      // If the user is logged in, provide mock applications
      // TODO: When we move to Sequelize for model loading, make this load in parallel with other data
      models.recentlyViewedApplications = [];
      if (req.candidate) {
        // Fallback our application ids
        var recentlyViewedApplicationIds = req.session.recentlyViewedApplicationIds =
          req.session.recentlyViewedApplicationIds || [];

        // Resolve our current set of application ids
        // TODO: When we move to Sequelize, use user id in query
        models.recentlyViewedApplications = recentlyViewedApplicationIds.map(applicationMockData.getById);

        // If any of the models have been deleted, update our ids
        var updateRecentlyViewedApplicationIds = function () {
          req.session.recentlyViewedApplicationIds = _.pluck(models.recentlyViewedApplications, 'id');
        };
        if (models.recentlyViewedApplications.length !== recentlyViewedApplicationIds.length) {
          updateRecentlyViewedApplicationIds();
        }

        // Add method to add new recent model
        req.addRecentlyViewedApplication = function (application) {
          // DEV: For all updates in here, we use mutation methods to avoid rewriting `res.locals`

          // If our application already exists in the array, remove it from the array
          // DEV: We could use `recentlyViewedApplicationIds` but this insulates us from out of sync data structures
          // DEV: We could skip index 0 but adds unnecessary complication to our code
          var recentlyViewedApplicationIds = _.pluck(models.recentlyViewedApplications, 'id');
          var existingIndex = recentlyViewedApplicationIds.indexOf(application.id);
          if (existingIndex !== -1) {
            models.recentlyViewedApplications.splice(existingIndex, 1);
          }

          // Push our application to the head of the array
          // [0, 1, 2] -> [new, 0, 1, 2]
          models.recentlyViewedApplications.unshift(application);

          // If we have over 3 items, cut off the last ones
          // DEV: We use splice as a safety check for more than 4 applications (e.g. count changed in design)
          // [new, 0, 1, 2, ...] -> [new, 0 ,1]
          if (models.recentlyViewedApplications.length > 3) {
            models.recentlyViewedApplications.splice(3, models.recentlyViewedApplications.length - 3);
          }

          // Update our application ids
          updateRecentlyViewedApplicationIds();
        };
      }
    }

    // Extend and save/expose our models
    // DEV: `res.locals` is a bit dangerous as we could overwrite an attribute like `candidate`
    //   but it avoids rewrite noise with `render` and annoying namespaces in views (e.g. `models.applications`)
    //   We are attempting to save ourselves by naming `asLocals` in function
    req.models = models = _.defaults(models, resolver.call(this, req));
    _.extend(res.locals, models);

    // Flag our locals as using `resolveModelsAsLocals`
    res.locals._loadedModels = true;

    // Continue
    next();
  };
};
