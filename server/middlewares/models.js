// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var async = require('async');
var HttpError = require('http-errors');
var config = require('../index.js').config;
var includes = require('../models/utils/includes');
var applicationMockData = require('../models/application-mock-data');

// Define helper functions
function noop() {}
function isModel(val) {
  return val && val.$modelOptions;
}

// TODO: Move to pattern with multiple functions;
//   retrieve all models `loadModels(function (req, res) { req.models = {a: A.get(1)} })`,
//   update models `(req, res)`,
//   save changes `saveModels`, flash + redirect `(req, res)`

// Define our middleware
// DEV: We considered this against a wrapper around Express routes (e.g. `routes.get`)
//   We chose a standalone middleware so we can place it as needed (e.g. after `ensureLoggedIn` )
//   and we don't essentially wind up rewriting middleware support under a bespoke API
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
    var unresolvedModels = {};

    // Determine if we want to use mocks/not
    var resolverContext = {useMocks: false};
    if (req.session.useMocks === true) {
      // If we don't allow mock usage, bail as something is seriously wrong
      if (config.allowMocks !== true) {
        return next(new Error('`req.session.useMocks` was set to `true` but ' +
          '`config.allowMocks` was set to `false'));
      }

      // Otherwise, update context
      resolverContext.useMocks = true;
    }

    // If we want to load nav content
    if (params.nav !== false) {
      // If the user is logged in, provide mock applications
      unresolvedModels.recentlyViewedApplications = [];
      if (req.candidate) {
        // Fallback our application ids
        var recentlyViewedApplicationIds = req.session.recentlyViewedApplicationIds =
          req.session.recentlyViewedApplicationIds || [];

        // Resolve our current set of application ids
        // TODO: When we move to Sequelize, use user id in query
        var applicationOptions = {
          where: {
            candidate_id: req.candidate.id,
            id: {$in: recentlyViewedApplicationIds}
          },
          include: includes.applicationNavContent
        };
        if (resolverContext.useMocks) {
          unresolvedModels.recentlyViewedApplications = applicationOptions.where.id.$in.map(
              function getApplicationById (id) {
            return applicationMockData.getById(id, applicationOptions);
          });
        } else {
          unresolvedModels.recentlyViewedApplications = applicationOptions.where.id.$in.map(
              function getApplicationById (id) {
            return applicationMockData.getById(id, applicationOptions);
          });
        }
      }
    }

    // Load our other models
    var resolverModels = resolver.call(resolverContext, req);
    var verifyNot404 = [];
    _.each(resolverModels, function handleResolverModel (val, key) {
      // If we have a key ending in Or404, strip ending and save it for later
      if (key.slice(-1 * 'Or404'.length) === 'Or404') {
        key = key.slice(0, -1 * 'Or404'.length);
        verifyNot404.push(key);
      }

      // Save our model under its cleaned key
      unresolvedModels[key] = val;
    });

    // Wait for async loading and save models onto another object
    // DEV: We use a separate object to prevent exposing promises to views
    async.mapValues(unresolvedModels, function waitForModelToLoad (val, key, cb) {
      // If the model is a promise, wait for it to resolve and callback
      // DEV: We use name checking as we don't know if a promise is Bluebird, ES6, or other
      if (val && val.constructor.name === 'Promise') {
        val.asCallback(cb);
      // Otherwise (e.g. model is a mock), callback with data
      } else if (val === null || Array.isArray(val) || isModel(val) || val._serializeExempt) {
        // DEV: null is for 404 mocks, `_serializeExempt` is for company data mocks
        // DEV: We use `nextTick` to avoid zalgo
        process.nextTick(function handleNextTick () {
          cb(null, val);
        });
      } else {
        cb(new Error('Unrecognized model type in `resolveModelsAsLocals`. ' +
          'Expected Promise, array, or Sequelize.Instance but received something else'));
      }
    }, function handleErr (err, models) {
      // If we are loading from nav and the models loaded successfully
      if (params.nav !== false && recentlyViewedApplicationIds && models.recentlyViewedApplications) {
        // If any of the models have been deleted, update our ids
        var getApplicationIds = function (applications) {
          return applications.map(function getApplicationId (application) {
            return application.get('id');
          });
        };
        var updateRecentlyViewedApplicationIds = function () {
          req.session.recentlyViewedApplicationIds = getApplicationIds(models.recentlyViewedApplications);
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
          var recentlyViewedApplicationIds = getApplicationIds(models.recentlyViewedApplications);
          var existingIndex = recentlyViewedApplicationIds.indexOf(application.get('id'));
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

      // Expose/save our models
      req.models = models;
      var _render = res.render;
      res.render = function () {
        // Serialize our models
        var serializedModels = _.mapObject(models, function serializeModelsObj (modelOrModels, key) {
          function serializeModel(model) {
            // If our model is serialization exempt, return it as is
            if (model._serializeExempt) {
              return model;
            }

            // Serialize our model
            assert(isModel(model), '`resolveModelsAsLocals` expected "' + key + '" to be a model but it wasn\'t');
            return model.get({plain: true});
          }
          if (Array.isArray(modelOrModels)) {
            return modelOrModels.map(serializeModel);
          } else {
            return serializeModel(modelOrModels);
          }
        });

        // Expose our serializations onto res.locals
        // DEV: `res.locals` is a bit dangerous as we could overwrite an attribute like `candidate`
        //   but it avoids rewrite noise with `render` and annoying namespaces in views (e.g. `models.applications`)
        //   We are attempting to save ourselves by naming `asLocals` in function
        _.extend(res.locals, serializedModels);

        // Flag our locals as using `resolveModelsAsLocals`
        res.locals._loadedModels = true;

        // Call our normal render function
        return _render.apply(this, arguments);
      };

      // If we had an error, callback with it as our `render` is all set up
      if (err) {
        return next(err);
      }

      // Verify we aren't missing any 404 models, otherwise remove them to prevent serialization issues
      var missingAModel = false;
      _.each(verifyNot404, function modelIsMissing (key) {
        if (models[key] === null) {
          missingAModel = true;
          delete models[key];
        }
      });

      // If we were missing a model, then 404
      if (missingAModel) {
        return next(new HttpError.NotFound());
      }

      // Callback
      next();
    });
  };
};
