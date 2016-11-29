// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Define our configurations
// https://us-west-2.console.aws.amazon.com/ses/home#smtp-settings:
// SES setup notes: https://gist.github.com/twolfson/da40925ac398ee66942f0564e6d420f2
// Email SaaS comparison: https://gist.github.com/twolfson/b44d4ae015c21a5bb56a1b4ec8f3ff2c
exports.common = {
  email: {
    // https://github.com/nodemailer/nodemailer/tree/v2.6.4#set-up-smtp
    host: undefined, // OVERRIDE: Need to override in each environment
    port: 465, // Also accepts 25 and 587
    secure: true, // Uses TLS
    // https://github.com/nodemailer/nodemailer/tree/v2.6.4#authentication
    auth: {
      user: undefined, // OVERRIDE: Need to override in each environment
      pass: undefined // OVERRIDE: Need to override in each environment
    }
  }
};

var PRODUCTION_PASSWORD = staticSecrets.staticEmail.productionPassword;
assert(PRODUCTION_PASSWORD);
exports.development = {
  email: _.defaults({
    host: 'email-smtp.us-west-2.amazonaws.com',
    // DEV: We use production username/password for development
    auth: {
      user: 'AKIAJJ5EENQ5B3K5JHEQ',
      pass: PRODUCTION_PASSWORD
    }
  }, exports.common.email)
};

exports.test = {
  email: _.defaults({
    // DEV: We will use stubbing to catch emails before they are sent
    host: 'mock-host',
    auth: {
      user: 'mock-username',
      pass: 'mock-password'
    }
  }, exports.common.email)
};

exports.production = {
  email: exports.development.email
};
