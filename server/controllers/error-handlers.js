// Load in our dependencies
var HttpError = require('http-errors');
var jsonStringifySafe = require('json-stringify-safe');
var MultiDictKeyError = require('querystring-multidict').MultiDictKeyError;
var statuses = require('statuses');
var sentryParsers = require('raven/lib/parsers');
var app = require('../index.js').app;

// Define our constants
var GENERIC_ERROR_TITLE = 'Error encountered';
var GENERIC_ERROR_MESSAGE = 'We encountered an unexpected error. ' +
    'The development team has been notified and it should be fixed promptly.';

// Define our controllers
// DEV: We use 404 handler before generic error handler in case something is wrong in 404 controller
// DEV: We have verified both `use` and `all('*')` work for no controllers at all
//   and `next()` misses (e.g. no matching id)
app.use(function handle404Error (req, res, next) {
  res.status(404).render('error.jade', {
    message: 'We were unable to find the requested page.',
    title: 'Page not found'
  });
});

app.use(function handleHttpError (err, req, res, next) {
  // If the error is a MultiDictKeyError, then replace it with an HttpError
  // https://github.com/twolfson/querystring-multidict/tree/1.1.0#multidictkeyerror
  if (err instanceof MultiDictKeyError) {
    err = new HttpError.BadRequest(
      'Missing query string/body parameter: "' + err.key + '"');
  }

  // If there is no status, then continue to our generic error handler
  // https://github.com/getsentry/raven-node/blob/0.12.0/lib/middleware/connect.js#L16
  var status = err.status || err.statusCode || err.status_code;
  if (status === undefined) {
    return next(err);
  }

  // If our error wants to be exposed, then send its message directly
  // https://github.com/jshttp/http-errors/tree/1.5.0#api
  // https://github.com/jshttp/http-errors/tree/1.5.0#list-of-all-constructors
  if (err.expose) {
    res.status(status).render('error.jade', {
      message: err.message,
      title: GENERIC_ERROR_TITLE
    });
  // Otherwise, send a generic message
  } else {
    res.status(status).render('error.jade', {
      message: statuses[status],
      title: GENERIC_ERROR_TITLE
    });
  }
});

// DEV: This error handler always comes last in case other error handlers are broken
app.use(function handleGenericError (err, req, res, next) {
  // Log our error
  // TODO: Use actual Winston client
  app.notWinston.error(err);

  // Prepare and send our request for Sentry
  // https://github.com/getsentry/raven-node/blob/0.12.0/lib/middleware/connect.js#L21-L25
  // DEV: We overwrite `query` and `data` with the format Raven expects
  //   https://github.com/getsentry/raven-node/blob/0.12.0/lib/parsers.js#L112-L160
  //   https://docs.sentry.io/hosted/clientdev/interfaces/#special-interfaces
  // TODO: Add user information to sentryKwargs (e.g. email)
  // DEV: `captureError` allows for a callback with the Sentry id but we don't use/need it
  // DEV: `req.body` might not be defined if we encounter a 500 error before parsing it
  var sentryKwargs = sentryParsers.parseRequest(req);
  sentryKwargs.request.query_string = req._parsedUrl.query;
  sentryKwargs.request.data = req.body ? jsonStringifySafe(req.body.toObject()) : 'Unknown';
  app.sentryClient.captureError(err, sentryKwargs);

  // Render an error page
  try {
    res.status(500).render('error.jade', {
      message: GENERIC_ERROR_MESSAGE,
      title: GENERIC_ERROR_TITLE
    });
  } catch (renderErr) {
    // Log and report our render error
    // TODO: Use actual Winston client
    app.notWinston.error(err);
    app.sentryClient.captureError(renderErr, sentryKwargs);

    // Send a text only response
    res.status(500).set('Content-Type', 'text/plain').send(GENERIC_ERROR_MESSAGE);
  }
});
