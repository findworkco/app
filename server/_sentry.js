// Load in our dependencies
var raven = require('raven');

// Load our config
var config = require('../config').getConfig();

// Create a Sentry client
// DEV: We use a standalone file for Sentry so our `master` process can load it without excess
exports.sentryClient = new raven.Client(config.sentry.serverDSN, {
  environment: config.ENV,
  release: config.gitRevision
});
