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
        // TODO: Use session data for recently viewed applications
        models.recentlyViewedApplications = [
          applicationMockData.getById('abcdef-umbrella-corp-uuid'),
          applicationMockData.getById('abcdef-sky-networks-uuid'),
          applicationMockData.getById('abcdef-monstromart-uuid')
        ];
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
