// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Define our configurations
exports.common = {
  google: {
    // https://developers.google.com/+/web/api/rest/oauth#login-scopes
    clientID: undefined, // OVERRIDE: Need to override in each environment
    clientSecret: undefined, // OVERRIDE: Need to override in each environment
    scope: ['email']
  }
};

// https://console.developers.google.com/apis/credentials?project=app-development-144900
exports.development = {
  google: _.defaults({
    clientID: '607344720024-pm4njq4mcs2bphtj90vmcd4mqu1fkao0.apps.googleusercontent.com',
    clientSecret: 'qT4wm_4xh2LwlVFoZFZlSVgu'
  }, exports.common.google)
};

exports.test = {
  google: _.defaults({
    clientID: 'mock-google-client-id.apps.googleusercontent.com',
    clientSecret: 'mock-google-client-secret'
  }, exports.common.google)
};

// https://console.developers.google.com/apis/credentials?project=app-production-144901
var PRODUCTION_CLIENT_SECRET = staticSecrets.staticGoogle.productionClientSecret;
assert(PRODUCTION_CLIENT_SECRET);
exports.production = {
  google: _.defaults({
    clientID: '615051442595-q5ei231pa36pr88mnt8a8jgjelp3v3qq.apps.googleusercontent.com',
    clientSecret: PRODUCTION_CLIENT_SECRET
  }, exports.common.google)
};
