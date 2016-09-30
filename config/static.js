// Based on https://github.com/twolfson/twolfson.com/blob/3.87.0/config/static.js
// Load in our dependencies
var _ = require('underscore');
var execSync = require('child_process').execSync;

// DEV: When we want to store secrets, follow SOPS' all-in-one secret convention
//   We prefer it over per-file as we can use aliasing in non-JSON files
//   https://github.com/mozilla/sops/tree/f63597f901f50f07ff72452b4bdb485518b85de7/examples

// TODO: Add Winston logger

// Define generic settings
exports.common = {
  // TODO: Load from source other than `git` as it isn't guaranteed in production
  gitRevision: execSync('git rev-parse HEAD').toString('utf8').trim(),
  redisUrl: 'redis://127.0.0.1:6400'
};

exports.development = {
  loadDevelopmentRoutes: true,
  viewCache: false
};

exports.test = {
  loadDevelopmentRoutes: true,
  redisUrl: 'redis://127.0.0.1:6401',
  viewCache: true
};

exports.production = {
  loadDevelopmentRoutes: false,
  viewCache: true
};

// Merge in grouped settings
var configFiles = [
  './static-analytics', './static-database', './static-google',
  './static-session', './static-sentry', './static-url'
];
configFiles.forEach(function mergeConfigFile (configFile) {
  // Assert that the new config has no repeated keys
  var mainConfig = exports;
  var newConfig = require(configFile);
  var mainKeys = _.union(
    _.keys(mainConfig.common), _.keys(mainConfig.development),
    _.keys(mainConfig.test), _.keys(mainConfig.production)
  );
  var newKeys = _.union(
    _.keys(newConfig.common), _.keys(newConfig.development),
    _.keys(newConfig.test), _.keys(newConfig.production)
  );
  var sameKeys = _.intersection(mainKeys, newKeys);
  if (sameKeys.length > 0) {
    throw new Error('Duplicate keys found in multiple configs. Expected none. Found: ' + JSON.stringify(sameKeys));
  }

  // Add on the new properties
  _.extend(mainConfig.common, newConfig.common);
  _.extend(mainConfig.development, newConfig.development);
  _.extend(mainConfig.test, newConfig.test);
  _.extend(mainConfig.production, newConfig.production);
});
