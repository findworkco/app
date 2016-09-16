// Load in dependencies
var _ = require('underscore');
var assert = require('assert');
var staticUrl = require('./static-url');
var secrets = require('./static-secrets');

// Define our configurations
// https://github.com/expressjs/session/tree/v1.13.1
// DEV: `express-session` uses SHA256 HMAC for cookie signing
//    https://github.com/tj/node-cookie-signature/blob/1.0.6/index.js
// DEV: `express-session` uses Node.js' `crypto.randomBytes` implementation for ids
//   https://github.com/crypto-utils/uid-safe/blob/2.1.1/index.js
//   https://github.com/crypto-utils/random-bytes/blob/1.0.0/index.js
//   https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
exports.common = {
  session: {
    // https://github.com/jshttp/cookie/blob/v0.2.3/index.js
    cookie: {
      domain: undefined, // OVERRIDE: Need to override in each environment
      path: '/',
      httpOnly: true,
      secure: undefined, // OVERRIDE: Need to override in each environment
      maxAge: 1000 * 60 * 60 * 24 * 7 * 2,  // 2 weeks
      firstPartyOnly: true
    },
    name: 'sid',
    proxy: undefined, // Use "trust proxy" from express
    resave: false, // Don't resave on no modification, only touch
    rolling: true, // Prevent sessions from ever expiring as long as site is visited
    saveUninitialized: true, // Always save a session cookie (we will anyway for CSRF)
    secret: undefined, // OVERRIDE: Need to override in each environment
    store: undefined, // Defined in `server`
    unset: 'destroy' // When someone explicitly deletes the session, then destroy it
  }
};

var DEVELOPMENT_SECRET = secrets['static-session']['development-secret'];
assert(DEVELOPMENT_SECRET);
exports.development = {
  session: _.defaults({
    cookie: _.defaults({
      domain: staticUrl.development.url.external.hostname,
      secure: staticUrl.development.url.external.protocol === 'https'
    }, exports.common.session.cookie),
    secret: DEVELOPMENT_SECRET
  }, exports.common.session)
};

exports.test = {
  session: _.defaults({
    cookie: _.defaults({
      // DEV: We hardcode these values due to contradictions in test config
      domain: null,
      secure: false
    }, exports.common.session.cookie),
    secret: 'supersecret.test'
  }, exports.common.session)
};

var PRODUCTION_SECRET = secrets['static-session']['production-secret'];
assert(PRODUCTION_SECRET);
exports.production = {
  session: _.defaults({
    cookie: _.defaults({
      domain: staticUrl.production.url.external.hostname,
      secure: staticUrl.production.url.external.protocol === 'https'
    }, exports.common.session.cookie),
    secret: PRODUCTION_SECRET
  }, exports.common.session)
};
