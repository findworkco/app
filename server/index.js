// Load in our dependencies
var assert = require('assert');
var domain = require('domain');
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
var sentryUtils = require('./utils/sentry');
var tzLocales = require('./utils/tz-locales');
var appLocals = {
  _: require('underscore'),
  assert: require('assert'),
  ACCEPTABLE_NOTIFICATION_TYPES: require('./utils/notifications').ACCEPTABLE_TYPES,
  countryData: require('country-data'),
  moment: require('moment-timezone'),
  sanitizeHtml: require('sanitize-html'),
  timezoneAbbrs: require('./utils/timezone-abbrs.js')
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

// Save time-dependent locals
appLocals.timezonesByCountryCode = tzLocales.getCurrent();
setInterval(function updateTimezoneByCountryCode () {
  appLocals.timezonesByCountryCode = tzLocales.getCurrent();
}, 1000 * 60 * 60 /* 1 hour */);

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
  // http://docs.sequelizejs.com/en/v3/api/sequelize/#new-sequelizedatabase-usernamenull-passwordnull-options
  var psqlConfig = config.postgresql;
  app.sequelize = new Sequelize(psqlConfig.database, psqlConfig.username, psqlConfig.password, {
    host: psqlConfig.host,
    port: psqlConfig.port,
    dialect: 'postgres',
    logging: config.logQueries ? console.log : false,
    define: {
      // http://docs.sequelizejs.com/en/v3/docs/models-definition/#configuration
      timestamps: true,
      underscored: true
    }
  });

  // Set up development 500 error
  // DEV: We perform this before most `app.use` to emphasize not all `res.locals` will be available in case of error
  if (config.loadDevelopmentRoutes) {
    app.use('/_dev/500', function dev500Show (req, res, next) {
      // DEV: We add a special flag so we can test error not being thrown for Gemini
      var err = new Error('Development 500 error');
      err.dontThrow = true;
      throw err;
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
  // DEV: Candidate serialization/deserialization is defined at the end of this file
  app.use(passport.initialize({userProperty: 'candidate'}));
  app.use(passport.session());

  // Expose logged in candidate to render
  // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/instance.js#L203
  app.use(function exposeLoggedInCandidate (req, res, next) {
    res.locals.candidate = req.candidate ? req.candidate.get({plain: true, clone: true}) : null;
    next();
  });

  // Load existing flash notifications before routing
  app.use(function loadExistingFlashNotifications (req, res, next) {
    res.locals.notifications = req.flash();
    next();
  });

  // Load various page configurations
  app.use(function configurePage (req, res, next) {
    res.locals.clean_css = req.session.cleanCss;
    next();
  });

  // Add a middleware to report non-critical errors to Sentry
  app.use(function addCaptureError (req, res, next) {
    req.captureError = function (err) {
      // Log our error
      // TODO: Use actual Winston client
      app.notWinston.error(err);

      // Prepare and send our request for Sentry
      var sentryKwargs = sentryUtils.parseRequest(req);
      app.sentryClient.captureError(err, sentryKwargs);
    };
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

// Configure saving/loading users by their session
// http://passportjs.org/docs#sessions
// DEV: We load `Candidate` model here due to needing `app.sequelize` to be loaded
var Candidate = require('./models/candidate');
passport.serializeUser(function handleSerializeUser (candidate, cb) {
  cb(null, candidate.get('id'));
});
passport.deserializeUser(function handleDeserializeUser (id, cb) {
  // DEV: Domains are overkill here as this is within a domain-wrapped controller
  //   However, we use it here for clarity
  var deserializeDomain = domain.create();
  deserializeDomain.on('error', cb);
  deserializeDomain.run(function handleRun () {
    Candidate.findById(id).asCallback(cb);
  });
});

// Load our controller bindings
void require('./controllers/index.js');
