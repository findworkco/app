// Load in our dependencies
var assert = require('assert');
var async = require('async');
var Promise = require('bluebird');
var Sequelize = require('sequelize');
var app = require('../../index.js').app;
var AuditLog = require('../audit-log');

// Export our function
exports.saveModelsViaCandidate = function (params, _callback) {
  // Assert our parameters
  // DEV: We could support server based saving but this is simpler for now
  var models = params.models;
  assert(models);
  assert(params.candidate);

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
      app.sequelize.transaction(function handleTransaction (t) {
        return Promise.all(models.map(function getSaveQuery (model) {
          return model.save({
            _sourceType: AuditLog.SOURCE_CANDIDATES,
            _sourceId: params.candidate.get('id'),
            transaction: t
          });
        }));
      }).asCallback(callback);
    }
  ], _callback);
};
