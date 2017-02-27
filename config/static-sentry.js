// Load in dependencies
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Localize our DSN secrets
var BROWSER_DSN = 'https://8fb7e7e068244e31adc0d87738cade76@sentry.io/102002';
var CSP_REPORT_URI = 'https://sentry.io/api/102002/csp-report/?sentry_key=8fb7e7e068244e31adc0d87738cade76';
var SERVER_DSN = staticSecrets.staticSentry.serverDSN;
assert(SERVER_DSN);

// Define our configurations
exports.common = {
  // By default, send no info to Sentry
  sentry: {
    browserDSN: null,
    cspReportUri: null,
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
    cspReportUri: CSP_REPORT_URI,
    serverDSN: SERVER_DSN
  }
};
