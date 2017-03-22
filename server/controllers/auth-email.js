// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var app = require('../index.js').app;
var config = require('../index.js').config;
var queue = require('../queue');
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;

// Define our token helpers
// DEV: We use `crypto.randomBytes` as it's the same library that Express uses (via `uid-safe`) for session ids
//   Under the hood, this is `/dev/random` or `/dev/urandom`
// DEV: We salt/hash our generated token to make guessing our `/dev/random` or `/dev/urandom` seed values harder
//   Sessions use HMAC which allows for persisting session id while verifying it wasn't guessed based on seed values
var GENERATION_SALT = config.authEmail.generationSalt;
assert(GENERATION_SALT);
// DEV: We use a low round count as we don't care about CPU waste since chances expire quickly
var SALT_ROUNDS = 5;
exports.generateEmailToken = function (cb) {
  // SHA256 uses 256 bits so generate exactly that for maximum entropy with minimal collisions
  // https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
  // DEV: Callback name is bound to test stubs so update both
  crypto.randomBytes(256, function handleRandomBytes (err, randomBuff) {
    // If there was an error, callback with it
    if (err) {
      return cb(err);
    }

    // Otherwise, salt and hash our random buffer
    // https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm
    // https://nodejs.org/api/crypto.html#crypto_class_hash
    // DEV: We can't use bcrypt as it has a custom serialization output (e.g.
    var sha256HashObj = crypto.createHash('sha256');
    sha256HashObj.write(randomBuff);
    sha256HashObj.write(GENERATION_SALT);
    var sha256Str = sha256HashObj.digest();

    // Extract a base 36 string (0-9A-Z) from our SHA256 string
    var token = sha256Str.toString('base64').toUpperCase()
      .replace(/[^A-Z0-9]/g, '').slice(0, 6);
    assert.strictEqual(token.length, 6);

    // Encrypt our token to generate its hash for our session
    bcrypt.hash(token, SALT_ROUNDS, function handleTokenBcryptHash (err, tokenHash) {
      // If there was an error, callback with it
      if (err) {
        return cb(err);
      }

      // Otherwise, callback with our token and its hash
      cb(null, token, tokenHash);
    });
  });
};

// Bind our controllers
function setAuthActionLogin(req, res, next) {
  res.locals.action = 'login';
  next();
}
function setAuthActionSignUp(req, res, next) {
  res.locals.action = 'sign_up';
  next();
}

// Controllers: /:auth/email/request
assert(config.authEmail.timeout);
var authEmailRequestSaveFns = [
  resolveModelsAsLocals({nav: false}),
  function authEmailRequestShow (req, res, next) {
    // Resolve our action
    var action = res.locals.action;
    assert(action);

    // If we didn't receive an email, then error out to user
    var email = req.body.fetch('email');
    if (!email) {
      req.session.authError = 'No email was provided';
      return res.redirect(action === 'sign_up' ?
        '/sign-up' : '/login');
    }

    // Generate our token
    exports.generateEmailToken(function handleGenerateEmailToken (err, token, tokenHash) {
      // If there was an error, bail out
      if (err) {
        return next(err);
      }

      // Otherwise, save our token to the session
      var expiresAt = Date.now() + config.authEmail.timeout;
      req.session.authEmail = email;
      req.session.authEmailTokenHash = tokenHash;
      req.session.authEmailExpiresAt = expiresAt;

      // Send an email request to our candidate
      // DEV: We use a queue to resolve candidates to prevent timing attacked
      queue.create(queue.JOBS.SEND_AUTH_EMAIL, {
        action: action,
        email: email,
        token: token,
        expiresAt: expiresAt
      }).save(function handleSendAuthEmail (err) {
        // If there was an error, callback with it
        if (err) {
          return next(err);
        }

        // Redirect to token resolve page
        return res.redirect(action === 'sign_up' ?
          '/sign-up/email' : '/login/email');
      });
    });
  }
];
app.post('/login/email/request', _.flatten([
  setAuthActionLogin,
  authEmailRequestSaveFns
]));
app.post('/sign-up/email/request', _.flatten([
  setAuthActionSignUp,
  authEmailRequestSaveFns
]));

// Controllers: /:auth/email (manual entry)
function validateAuthEmailValid(req, res, next) {
  // Resolve our action
  var action = res.locals.action;
  assert(action);

  // If our auth request is invalid or expired
  if (!req.session.authEmail || !req.session.authEmailTokenHash || !req.session.authEmailExpiresAt ||
      req.session.authEmailExpiresAt < Date.now()) {
    // Wipe its contents
    delete req.session.authEmail;
    delete req.session.authEmailTokenHash;
    delete req.session.authEmailExpiresAt;

    // Redirect our user back to their original auth page
    var loggingInStr = action === 'sign_up' ? 'signing up' : 'logging in';
    req.session.authError = 'Email authentication request has expired. Please try ' + loggingInStr + ' again';
    return res.redirect(action === 'sign_up' ? '/sign-up' : '/login');
  }

  // Expose our email and continue
  res.locals.authEmail = req.session.authEmail;
  next();
}
var authEmailShowFns = [
  validateAuthEmailValid,
  resolveModelsAsLocals({nav: true}),
  function authEmailShow (req, res, next) {
    res.render('auth-email.jade', {
      page_url: req.url
    });
  }
];
app.get('/login/email', _.flatten([
  setAuthActionLogin,
  authEmailShowFns
]));
app.get('/sign-up/email', _.flatten([
  setAuthActionSignUp,
  authEmailShowFns
]));
