// Load in our dependencies
var assert = require('assert');
var express = require('express');

// DEV: Historically I (@twolfson) have built Node.js servers that aren't singleton based
//   This means a controller would receive a `app` or `config` and return a function
//   The main benefit of not using singletons is we can test one-off configurations easily (e.g. altering loggers)
//   However, I have concluded that dodging singletons yields little benefit with high maintenance costs
//   As a result, we are moving with a more Flask-like architecture (i.e. singleton)

// TODO: Set up configuration (including NODE_ENV coercion)
// TODO: Add view caching to test environment: https://gist.github.com/twolfson/f81a4861d834929abcf3
// TODO: Add winston logger
// TODO: Set up Sentry (browser and server)
// TODO: Set up SOPS

// Define our server constructor
function Server(config) {
  // Save our configuration for later
  this.config = config;

  // Create a new server
  this.app = express();

  // TODO: Add uncaught exception handler binding
}
Server.prototype.listen = function () {
  assert.strictEqual(this._app, undefined, 'A server is already listening to a port. Please `close` first');
  this._app = this.app.listen(this.config.port);
};
Server.prototype.close = function (cb) {
  assert.notEqual(this._app, undefined, 'No server was found to `close`');
  this._app.close(cb);
  delete this._app;
};

// Export a new server
// TODO: When we move to Vagrant, update `host` to be `0.0.0.0` so we can access it
module.exports = new Server({
  // Listener bindings
  host: '127.0.0.1',
  port: 9000,

  url: {
    internal: {
      protocol: 'http',
      hostname: 'localhost',
      port: 9000
    },
    external: {
      protocol: 'http',
      hostname: 'localhost',
      port: 9000

      // Production
      // protocol: 'https'
      // hostname: 'findwork.co'
    }
  }
});

// Load our controller bindings
void require('./controllers/index.js');
