// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var express = require('express');
var appLocals = {
  countryData: require('country-data'),
  moment: require('moment-timezone'),
  timezoneAbbrs: require('./utils/timezone-abbrs.js'),
  timezonesByCountryCode: require('../vendor/tz-locales.json')
};

// DEV: Historically I (@twolfson) have built Node.js servers that aren't singleton based
//   This means a controller would receive a `app` or `config` and return a function
//   The main benefit of not using singletons is we can test one-off configurations easily (e.g. altering loggers)
//   However, I have concluded that dodging singletons yields little benefit with high maintenance costs
//   As a result, we are moving with a more Flask-like architecture (i.e. singleton)

// Load our config
var config = require('../config').getConfig();

// Define our server constructor
function Server(config) {
  // Save our configuration for later
  this.config = config;

  // Create a new server
  var app = this.app = express();

  // Host our static files
  app.use('/dist', express.static(__dirname + '/../dist'));

  // Configure our views
  // http://expressjs.com/en/guide/using-template-engines.html
  app.use(function bindResponseLocals (req, res, next) {
    res.locals.urlPath = req.path;
    next();
  });
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  // DEV: We set view cache to true during testing for performance
  //   https://gist.github.com/twolfson/f81a4861d834929abcf3
  app.set('view cache', config.viewCache);

  // Define our application locals
  app.locals = _.defaults(app.locals, appLocals);
}
Server.prototype.listen = function () {
  assert.strictEqual(this._app, undefined, 'A server is already listening to a port. Please `close` first');
  this._app = this.app.listen(this.config.port, this.config.hostname);
};
Server.prototype.close = function (cb) {
  assert.notEqual(this._app, undefined, 'No server was found to `close`');
  this._app.close(cb);
  delete this._app;
};

// Export a new server
module.exports = new Server(config);

// Load our controller bindings
void require('./controllers/index.js');
