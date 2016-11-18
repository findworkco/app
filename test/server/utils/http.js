// Taken from https://gist.github.com/twolfson/3af2ed0a016f877d676d
// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var url = require('url');
var cheerio = require('cheerio');
var request = require('request');
var serverUtils = require('./server');

// Copy over utilities from request-mocha
// https://github.com/uber-archive/request-mocha/blob/0.2.0/lib/request-mocha.js
// DEV: We use copy/paste as it's easier to integrate Cheerio parsing
exports._save = function (options) {
  return function _saveFn (done) {
    // If we haven't decided on following a redirect, default to nope
    // DEV: This prevents us following redirect to login accidentally with a 200
    if (options.followRedirect === undefined) {
      options.followRedirect = false;
    }

    // If there is a form generator, then run it
    if (options.htmlForm) {
      // Verify we have a body to base on
      assert(this.$, 'Expected `this.$` to be defined from previous `save` but it was not. ' +
        'Please use `httpUtils.save` before using `htmlForm` in a subsequent request');

      // Fallback form selector to target URL (e.g. `form[action=/add-application]`)
      var hostlessUrl = options.url.replace(serverUtils.getUrl(''), '');
      var htmlFormSelector = options.htmlFormSelector || 'form[action="' + _.escape(hostlessUrl) + '"]';

      // Resolve and verify our form exists
      var $htmlForm = this.$(htmlFormSelector);
      assert($htmlForm.length, 'No HTML form was found under selector "' + htmlFormSelector + '"');
      var actualHttpMethod = ($htmlForm.attr('method') || 'GET');
      assert.strictEqual(actualHttpMethod.toUpperCase(), options.method.toUpperCase(),
        'Expected HTML form to use method "' + options.method + ' but it was using "' + actualHttpMethod + '". ' +
        'Please verify `httpUtils.save` is using expected `method` parameter');

      // If `options.htmlForm` is `true`, then use the form as is
      if (options.htmlForm === true) {
        options.htmlForm = _.identity;
      }

      // Complete and serialize our form
      // DEV: We allow for returning a new element as the form or using the original
      var formData = (options.htmlForm.call(this, $htmlForm) || $htmlForm).serialize();
      if (options.method.toUpperCase() === 'GET') {
        options.url += '?' + formData;
      } else {
        options.form = formData;
      }
    }

    // If there is a CSRF form to generate, then collect our CSRF token and generate a form
    if (options.csrfForm) {
      assert(options.jar, 'Expected `csrfForm` to be used in a `httpUtils.session` context but it was not');
      request({
        jar: options.jar,
        url: serverUtils.getUrl('/add-application/save-for-later')
      }, function handleRequest (err, res, body) {
        // If there was an error, callback with it
        if (err) {
          return done(err);
        }

        // Otherwise, scrape our CSRF token and pass it along as a form
        assert.strictEqual(res.statusCode, 200);
        var csrfToken = cheerio.load(body)('input[name=x-csrf-token]').val();
        assert(csrfToken);
        options = _.defaults({
          form: 'x-csrf-token=' + encodeURIComponent(csrfToken)
        }, options);

        // Continue to our request
        next();
      });
    // Otherwise, make our request
    } else {
      next();
    }

    // Make our request
    var that = this;
    function next() { // jshint ignore:line
      request(options, function handleRequest (err, res, body) {
        // Save our results to `this` context
        that.err = err;
        that.res = res;
        that.body = body;

        // Verify status code is as expected (default of 200)
        // DEV: `expectedStatusCode` can be opted out via `null`
        var expectedStatusCode = options.expectedStatusCode !== undefined ? options.expectedStatusCode : 200;
        if (expectedStatusCode) {
          assert.strictEqual(err, null);
          if (res.statusCode !== expectedStatusCode) {
            var assertionMsg = 'Expected status code "' + expectedStatusCode + '" ' +
              'but received "' + res.statusCode + '" and body "' + body + '"';
            try {
              var errorMsg = cheerio.load(body)('#_error').text();
              assertionMsg = 'Expected status code "' + expectedStatusCode + '" but ' +
              'received "' + res.statusCode + '" , error "' + errorMsg + '", and body "' + body.slice(0, 300) + '..."';
            } catch (loadErr) {
              // Ignore error (assuming we can't parse body or find error
            }
            assert.strictEqual(res.statusCode, expectedStatusCode, assertionMsg);
          }
        }

        // If there was a request to parse the response, then do it
        if (options.parseHTML !== false) {
          try {
            that.$ = cheerio.load(body);
          } catch (err) {
            console.error('Tried to parse response body as HTML but failed. ' +
              'If response should not be parsed, set `parseHTML` to `false`');
            throw err;
          }
        }

        // Callback
        done();
      });
    }
  };
};
exports._saveCleanup = function () {
  return function _saveCleanupFn () {
    delete this.err;
    delete this.res;
    delete this.body;
    delete this.$;
  };
};
exports.save = function (options) {
  before(exports._save(options));
  after(exports._saveCleanup(options));
};

// Define session-based methods
exports.session = {
  _save: function (options) {
    return function saveFn (done) {
      // Verify we have a cookie jar to leverage
      assert(this.jar, '`this.jar` does not exist. Please use `exports.session.login` ' +
        'to let us know when a new session is beginning.');

      // If our parameter is a string, upcast it to an object
      if (typeof options === 'string') {
        options = {
          jar: this.jar,
          url: options
        };
      // Otherwise, add on our jar
      } else {
        options = _.defaults({
          jar: this.jar
        }, options);
      }

      // Make our request
      return exports._save(options).call(this, done);
    };
  },
  save: function (options) {
    before(exports.session._save(options));
    after(exports._saveCleanup(options));
    return this;
  },
  init: function () {
    before(function initFn () {
      // If there already is a session, complain and leave
      assert(!this.jar, '`this.jar` already exists for `httpUtils.session` ' +
        '(meaning another session has been started). Please terminate the other session or reuse this one.');

      // Otherwise, generate a new cookie jar
      this.jar = request.jar();
    });
    after(function cleanup () {
      delete this.jar;
    });

    // Return this for a fluent interface
    return this;
  },
  // Define shorthand login with default candidate
  login: function () {
    return this.loginAs('mock-candidate');
  },
  loginAs: function (candidateName) {
    before(function loginAsFn () {
      // Verify a session already has been started
      assert(this.jar, '`this.jar` doesn\'t exists for `httpUtils.session` ' +
        '(meaning a session hasn\'t been started). Please begin a session before logging in.');
    });
    // Scrape state and pass along to callback with custom code
    // DEV: We are using `code` as a key to determine which candidate to log in
    //   so we cannot use `/oauth/google/request` as it uses a mock code
    exports.session.save({
      // Redirects to fake Google OAuth
      url: serverUtils.getUrl({
        pathname: '/oauth/google/request',
        query: {action: 'login'}
      }),
      followRedirect: false,
      expectedStatusCode: 302
    });
    before(function callbackWithCustomCode (done) {
      // Extract state from redirect URL
      var redirectURL = url.parse(this.res.headers.location, true);
      var state = redirectURL.query.state;
      assert(state);

      // Perform our custom callback
      exports.session._save({
        url: serverUtils.getUrl({
          pathname: '/oauth/google/callback',
          query: {action: 'login', state: state, code: candidateName}
        }),
        followRedirect: true,
        expectedStatusCode: 200
      }).call(this, done);
    });

    // Return this for a fluent interface
    return this;
  }
};
