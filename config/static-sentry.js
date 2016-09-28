// Load in dependencies
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Localize our DSN secrets
var BROWSER_DSN = staticSecrets.staticSentry.browserDSN;
assert(BROWSER_DSN);
var SERVER_DSN = staticSecrets.staticSentry.serverDSN;
assert(SERVER_DSN);

// Define our configurations
exports.common = {
  // By default, send no info to Sentry
  sentry: {
    browserDSN: null,
    serverDSN: null
  }
};

exports.development = {
  // Use common Sentry setup
};

exports.test = {
  // Use common Sentry setup
};

exports.production = {
  sentry: {
    browserDSN: BROWSER_DSN,
    serverDSN: SERVER_DSN
  }
};
