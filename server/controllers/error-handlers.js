// Load in our dependencies
var HttpError = require('http-errors');
var MultiDictKeyError = require('querystring-multidict').MultiDictKeyError;
var statuses = require('statuses');
var app = require('../index.js').app;
var config = require('../index.js').config;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var sentryUtils = require('../utils/sentry');

// Define our constants
var GENERIC_ERROR_TITLE = 'Error encountered';
var GENERIC_ERROR_MESSAGE = 'We encountered an unexpected error. ' +
    'The development team has been notified and it should be fixed promptly.';

// Define our controllers
// DEV: We use 404 handler before generic error handler in case something is wrong in 404 controller
// DEV: We have verified both `use` and `all('*')` work for no controllers at all
//   and `next()` misses (e.g. no matching id)
app.use([
  // DEV: Load navigation as a developer convenience
  resolveModelsAsLocals({nav: true}),
  function handle404Error (req, res, next) {
    next(new HttpError.NotFound());
  }
]);

app.use(function handleHttpError (err, req, res, next) {
  // If the error is a MultiDictKeyError, then replace it with an HttpError
  // https://github.com/twolfson/querystring-multidict/tree/1.1.0#multidictkeyerror
  if (err instanceof MultiDictKeyError) {
    err = new HttpError.BadRequest(
      'Missing query string/body parameter: "' + err.key + '"');
  }

  // If the error is a NotFound error, render a 404 normally
  // DEV: Without this call, we render "Error encountered" title
  if (err instanceof HttpError.NotFound) {
    return res.status(404).render('error.jade', {
      message: 'We were unable to find the requested page.',
      title: 'Page not found'
    });
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

  // If we should throw our error (caught/rendered by Express in dev), then throw it
  // DEV: We have `dontThrow` flag for testing generic errors in Gemini
  if (config.throwGenericErrors && !err.dontThrow) {
    throw err;
  }

  // Prepare and send our request for Sentry
  var sentryKwargs = sentryUtils.parseRequest(req);
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
