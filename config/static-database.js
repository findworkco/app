// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var secrets = require('./static-secrets');

// Define our configurations
var DEFAULT_DATABASE = 'find_work';
var DEVELOPMENT_PASSWORD = 'find_work';
var TEST_DATABASE = 'find_work_test';
exports.common = {
  postgresql: {
    host: '127.0.0.1',
    port: '5500',
    database: undefined, // OVERRIDE: Need to override in each environment
    // DEV: PostgreSQL uses `user` but Sequalize users `username`
    username: 'find_work',
    password: undefined // OVERRIDE: Need to override in each environment
  }
};

exports.development = {
  postgresql: _.defaults({
    database: DEFAULT_DATABASE,
    password: DEVELOPMENT_PASSWORD
  }, exports.common.postgresql)
};

exports.test = {
  postgresql: _.defaults({
    database: TEST_DATABASE,
    password: DEVELOPMENT_PASSWORD
  }, exports.common.postgresql)
};

var PRODUCTION_PASSWORD = secrets['static-postgresql']['production-password'];
assert(PRODUCTION_PASSWORD);
exports.production = {
  postgresql: _.defaults({
    database: DEFAULT_DATABASE,
    password: PRODUCTION_PASSWORD
  }, exports.common.postgresql)
};
