// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var async = require('async');
var Promise = require('bluebird');
var Sequelize = require('sequelize');
var sequelize = require('../../index.js').app.sequelize;
var AuditLog = require('../audit-log');

// Export our function
exports._saveModels = function (params, _queryOptions, _callback) {
  // Assert our parameters
  var models = params.models;
  var destroyModels = params.destroyModels;
  assert(models || destroyModels);

  // Fallback models/destroy models
  models = models || [];
  destroyModels = destroyModels || [];

  // In series
  async.series([
    function validateModels (callback) {
      // Perform all our validations in parallel
      // DEV: If we don't validate all items in parallel, then we will only see first validation error to occur
      async.map(models, function validateModel (model, cb) {
        model.validate().asCallback(cb);
      }, function handleResults (err, validationErrResults) {
        // If there was an error, callback with it
        if (err) { return callback(err); }

        // Concatenate all our validation results together
        var validationErrors = [];
        validationErrResults.forEach(function addValidationErrors (validationErrResult) {
          if (validationErrResult) {
            validationErrors = validationErrors.concat(validationErrResult.errors);
          }
        });

        // If we had errors, callback with them
        // https://github.com/sequelize/sequelize/blob/v3.28.0/lib/errors.js#L41-L61
        if (validationErrors.length) {
          return callback(new Sequelize.ValidationError(null, validationErrors));
        }

        // Otherwise, callback
        callback(null);
      });
    },
    function saveModels (callback) {
      sequelize.transaction(function handleTransaction (t) {
        var queryOptions = _.defaults({transaction: t}, _queryOptions);
        return Promise.all(models.map(function getSaveQuery (model) {
          return model.save(queryOptions);
        }).concat(destroyModels.map(function getDestroyQuery (model) {
          return model.destroy(queryOptions);
        })));
      }).asCallback(callback);
    }
  ], _callback);
};
exports.saveModelsViaCandidate = function (params, _callback) {
  // Resolve our query options
  assert(params.candidate);

  // Run our saveModels function
  return exports._saveModels(params, {
    _sourceType: AuditLog.SOURCE_CANDIDATES,
    _sourceId: params.candidate.get('id')
  }, _callback);
};
exports.saveModelsViaQueue = function (params, _callback) {
  return exports._saveModels(params, {
    _sourceType: AuditLog.SOURCE_QUEUE
  }, _callback);
};
exports.saveModelsViaServer = function (params, _callback) {
  return exports._saveModels(params, {
    _sourceType: AuditLog.SOURCE_SERVER
  }, _callback);
};
