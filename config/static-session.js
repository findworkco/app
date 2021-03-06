// Load in dependencies
var _ = require('underscore');
var assert = require('assert');
var staticUrl = require('./static-url');
var staticSecrets = require('./static-secrets');

// Define our configurations
// https://github.com/expressjs/session/tree/v1.13.0
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
    // Configure proxy trust to use `req.secure` from express
    // DEV: This can prevent sending cookies marked as Secure in production =/
    // DEV: "trust proxy" verifies most recent X-Forwarded-For is `https`
    //   https://github.com/expressjs/session/blob/v1.13.0/index.js#L550-L556
    //   https://github.com/expressjs/express/blob/4.14.0/lib/request.js#L325-L327
    //   https://github.com/expressjs/express/blob/4.14.0/lib/request.js#L300-L314
    proxy: undefined, // Use
    resave: false, // Don't resave on no modification, only touch
    rolling: true, // Prevent sessions from ever expiring as long as site is visited
    saveUninitialized: true, // Always save a session cookie (we will anyway for CSRF)
    secret: undefined, // OVERRIDE: Need to override in each environment
    store: undefined, // Defined in `server`
    unset: 'destroy' // When someone explicitly deletes the session, then destroy it
  }
};

var DEVELOPMENT_SECRET = staticSecrets.staticSession.developmentSecret;
assert(DEVELOPMENT_SECRET);
exports.development = {
  session: _.defaults({
    cookie: _.defaults({
      domain: null, // Allow IP or `localhost` (used for mobile dev)
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

var PRODUCTION_SECRET = staticSecrets.staticSession.productionSecret;
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
