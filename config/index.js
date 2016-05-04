// Load in our dependencies
var assert = require('assert');
var Settings = require('shallow-settings');
var staticConfig = require('./static');

// Resolve our environment
var env = process.env.ENV;
assert(env, 'Expected environment variable ENV to be set but it was not. ' +
  'Please use `ENV=development`, `ENV=test`, or `ENV=production`');
assert(['development', 'test', 'production'].indexOf(env) !== -1,
  'Expected environment variable ENV to be set be one of `development`, `test`, or `production` ' +
  'but it was "' + env + '"');

// Adjust our NODE_ENV to ENV as well (helps with Express setup)
process.env.NODE_ENV = env;

// Define our settings
exports.getConfig = function () {
  // Load our settings
  var settings = new Settings(staticConfig);
  var config = settings.getSettings({env: env});

  // Return our configuration
  return config;
};
