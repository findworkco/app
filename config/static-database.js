// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Define our configurations
var DEFAULT_DATABASE = 'find_work';
var DEVELOPMENT_PASSWORD = 'find_work';
var TEST_DATABASE = 'find_work_test';
exports.common = {
  postgresql: {
    // DEV: We use the same naming scheme as Sequelize so we can reuse these objects for migrations
    host: '127.0.0.1',
    port: '5500',
    database: undefined, // OVERRIDE: Need to override in each environment
    // DEV: PostgreSQL uses `user` but Sequalize users `username`
    username: 'find_work',
    password: undefined // OVERRIDE: Need to override in each environment
  }
};

exports.development = {
  // DEV: We use top level config as `postgresql` is passed directly to `sequelize-cli`
  logQueries: true,
  postgresql: _.defaults({
    database: DEFAULT_DATABASE,
    password: DEVELOPMENT_PASSWORD
  }, exports.common.postgresql)
};

exports.test = {
  logQueries: false,
  postgresql: _.defaults({
    database: TEST_DATABASE,
    password: DEVELOPMENT_PASSWORD
  }, exports.common.postgresql)
};

var PRODUCTION_PASSWORD = staticSecrets.staticPostgresql.productionPassword;
assert(PRODUCTION_PASSWORD);
exports.production = {
  logQueries: false,
  postgresql: _.defaults({
    database: DEFAULT_DATABASE,
    password: PRODUCTION_PASSWORD
  }, exports.common.postgresql)
};
