// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var express = require('express');
var bodyParserMultiDict = require('body-parser-multidict');
var connectFlash = require('connect-flash');
var csurf = require('csurf');
var expressSession = require('express-session');
var qsMultiDict = require('querystring-multidict');
var RedisSessionStore = require('connect-redis')(expressSession);
var raven = require('raven');
var redis = require('redis');
// DEV: ORM evaluation -- https://gist.github.com/twolfson/13eeeb547271c8ee32707f7b02c2ed90
var Sequelize = require('sequelize');
var appLocals = {
  ACCEPTABLE_NOTIFICATION_TYPES: require('./utils/notifications').ACCEPTABLE_TYPES,
  countryData: require('country-data'),
  moment: require('moment-timezone'),
  sanitizeHtml: require('sanitize-html'),
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

// Save configuration based locals
appLocals.sentryBrowserDSN = config.sentry.browserDSN;
appLocals.serveAnalytics = config.serveAnalytics;
appLocals.googleAnalyticsId = config.googleAnalyticsId;

// Define our server constructor
function Server(config) {
  // Save our configuration for later
  this.config = config;

  // Create a new server
  var app = this.app = express();

  // Host our static files
  app.use('/dist', express.static(__dirname + '/../dist'));
  app.use('/favicon.ico', express.static(__dirname + '/../dist/images/favicon.ico'));

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

  // Create a Sentry client
  app.sentryClient = new raven.Client(config.sentry.serverDSN, {
    environment: config.ENV,
    release: config.gitRevision
  });

  // Create a Redis client
  app.redisClient = redis.createClient(config.redisUrl);

  // Create a PostgreSQL client
  // http://docs.sequelizejs.com/en/latest/docs/getting-started/#setting-up-a-connection
  var psqlConfig = config.postgresql;
  app.postgresqlClient = new Sequelize(psqlConfig.database, psqlConfig.username, psqlConfig.password, {
    host: psqlConfig.host,
    port: psqlConfig.port,
    dialect: 'postgres'
  });

  // Integrate session middleware
  // https://github.com/tj/connect-redis/tree/3.0.2#faq
  app.use(expressSession(_.defaults({
    store: new RedisSessionStore({client: app.redisClient})
  }, config.session)));
  app.use(function handleDroppedSession (req, res, next) {
    // If we dropped our Redis connection, then error out this request
    // TODO: When we scale to multiple servers, crash server on Redis loss
    //   as we could have requests in unpredictable state
    // TODO: Log error to Sentry about no session
    if (!req.session) {
      return next(new Error('Request session could not be found/created'));
    }
    next();
  });

  // Add MultiDict based query string/body handling
  app.use(function overrideQueryString (req, res, next) {
    req.query = qsMultiDict.parse(req._parsedOriginalUrl.query);
    next();
  });
  app.use(bodyParserMultiDict.urlencoded());

  // Integrate CSRF on sessions (make sure this comes before flash messages to message loss)
  app.use(csurf({
    cookie: false,
    sessionKey: 'session',
    value: function (req) {
      return req.body.get('x-csrf-token');
    }
  }));
  app.use(function exposeCsrfInput (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
  });

  // Integrate flash notifications (depends on session middleware)
  app.use(connectFlash());

  // Load existing flash notifications before routing
  app.use(function loadExistingFlashNotifications (req, res, next) {
    res.locals.notifications = req.flash();
    next();
  });
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
