// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var bodyParserMultiDict = require('body-parser-multidict');
var connectFlash = require('connect-flash');
var csurf = require('csurf');
var express = require('express');
var expressSession = require('express-session');
var passport = require('passport');
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
appLocals.ENV = config.ENV; // Only use ENV for Sentry reporting
appLocals.googleAnalyticsId = config.googleAnalyticsId;
appLocals.gitRevision = config.gitRevision;
appLocals.sentryBrowserDSN = config.sentry.browserDSN;
appLocals.serveAnalytics = config.serveAnalytics;

// Define our server constructor
function Server(config) {
  // Save our configuration for later
  this.config = config;

  // Create a new server
  var app = this.app = express();

  // Configure our proxy trust
  app.set('trust proxy', config.trustProxy);

  // Host our static files
  app.use('/dist', express.static(__dirname + '/../dist'));
  app.use('/favicon.ico', express.static(__dirname + '/../dist/images/favicon.ico'));

  // Configure our views
  // http://expressjs.com/en/guide/using-template-engines.html
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  // DEV: We set view cache to true during testing for performance
  //   https://gist.github.com/twolfson/f81a4861d834929abcf3
  app.set('view cache', config.viewCache);

  // Define our application locals
  app.locals = _.defaults(app.locals, appLocals);

  // Create a fake Winston client
  // TODO: Setup proper winston client
  app.notWinston = {
    error: function (err) {
      console.error(err.stack);
    }
  };

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

  // Set up development 500 error
  // DEV: We perform this before most `app.use` to emphasize not all `res.locals` will be available in case of error
  if (config.loadDevelopmentRoutes) {
    app.use('/_dev/500', function dev500Show (req, res, next) {
      throw new Error('Development 500 error');
    });
  }

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
  // DEV: We avoid Express' query as it's inconsistent with multiple parameters
  //   https://speakerdeck.com/ckarande/top-overlooked-security-threats-to-node-dot-js-web-applications
  app.use(function overrideQueryString (req, res, next) {
    req._originalQuery = req.query;
    req.query = qsMultiDict.parse(req._parsedUrl.query);
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

  // Initialize Passport for authentication
  // https://github.com/jaredhanson/passport/tree/v0.3.2#middleware
  // Set `req.candidate` to be our candidate key
  //   https://github.com/jaredhanson/passport/blob/v0.3.2/lib/authenticator.js#L108-L129
  //   https://github.com/jaredhanson/passport/blob/v0.3.2/lib/strategies/session.js#L63-L64
  app.use(passport.initialize({userProperty: 'candidate'}));
  app.use(passport.session());

  // Configure saving/loading users by their session
  // http://passportjs.org/docs#sessions
  // TODO: Serialize/deserialize user by id on PostgreSQL (requires `candidate` table first)
  // TODO: Be sure to use domains when handling PostgreSQL data
  passport.serializeUser(function handleSerializeUser (user, cb) {
    cb(null, user.email);
  });
  passport.deserializeUser(function handleDeserializeUser (email, cb) {
    cb(null, {email: email});
  });

  // Expose logged in candidate to render
  app.use(function exposeLoggedInCandidate (req, res, next) {
    res.locals.candidate = req.candidate;
    next();
  });

  // Load existing flash notifications before routing
  app.use(function loadExistingFlashNotifications (req, res, next) {
    res.locals.notifications = req.flash();
    next();
  });
}
Server.prototype.listen = function () {
  assert.strictEqual(this._app, undefined, 'A server is already listening to a port. Please `close` first');
  this._app = this.app.listen(this.config.listen.port, this.config.listen.hostname);
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
