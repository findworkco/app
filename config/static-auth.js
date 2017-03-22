// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Define our configurations
exports.common = {
  authEmail: {
    timeout: 15 * 60 * 60 * 1000, // 15 minutes
    generationSalt: undefined // OVERRIDE: Need to override in each environment
  }
};

var DEVELOPMENT_GENERATION_SALT = staticSecrets.staticAuth.developmentEmailTokenGenerationSalt;
assert(DEVELOPMENT_GENERATION_SALT);
exports.development = {
  authEmail: _.defaults({
    generationSalt: DEVELOPMENT_GENERATION_SALT
  }, exports.common.authEmail)
};

exports.test = {
  authEmail: _.defaults({
    timeout: 100, // 100ms
    generationSalt: 'mock-generation-salt'
  }, exports.common.authEmail)
};

var PRODUCTION_GENERATION_SALT = staticSecrets.staticAuth.productionEmailTokenGenerationSalt;
assert(PRODUCTION_GENERATION_SALT);
exports.production = {
  authEmail: _.defaults({
    generationSalt: PRODUCTION_GENERATION_SALT
  }, exports.common.authEmail)
};
