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
    scope: ['email'],

    // https://github.com/jaredhanson/passport-google-oauth2/blob/v1.0.0/lib/strategy.js#L49-L54
    authorizationURL: undefined, // By default, use value set by `passport-google-oauth2`
    tokenURL: undefined, // By default, use value set by `passport-google-oauth2`
    // https://github.com/jaredhanson/passport-google-oauth2/pull/51/files#diff-04c6e90faac2675aa89e2176d2eec7d8R102
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
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
  fakeGoogle: {
    port: 7000
  },
  google: _.defaults({
    clientID: 'mock-google-client-id.apps.googleusercontent.com',
    clientSecret: 'mock-google-client-secret',

    // Override values to point to `fakeGoogle` server
    authorizationURL: 'http://localhost:7000/o/oauth2/v2/auth', // By default, use value set by `passport-google-oauth2`
    tokenURL: 'http://localhost:7000/oauth2/v4/token', // By default, use value set by `passport-google-oauth2`
    userProfileURL: 'http://localhost:7000/plus/v1/people/me' // By default, use value set by `passport-google-oauth2`
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
