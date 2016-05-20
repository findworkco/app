// Taken from https://gist.github.com/twolfson/3af2ed0a016f877d676d
// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var cheerio = require('cheerio');
var request = require('request');

// TODO: For form generation, experiment with `save` taking a function for `form`
//   But make sure `request` doesn't support that...

// Copy over utilities from request-mocha
// https://github.com/uber-archive/request-mocha/blob/0.2.0/lib/request-mocha.js
// DEV: We use copy/paste as it's easier to integrate Cheerio parsing
exports._save = function (options) {
  return function _saveFn (done) {
    // Make our request
    var that = this;
    request(options, function (err, res, body) {
      // Save our results to `this` context
      that.err = err;
      that.res = res;
      that.body = body;

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
  }
};
