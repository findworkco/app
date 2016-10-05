// Load in our dependencies
var jsonStringifySafe = require('json-stringify-safe');
var sentryParsers = require('raven/lib/parsers');
var app = require('../index.js').app;

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

// DEV: This error handler always comes last in case other error handlers are broken
app.use(function handleGenericError (err, req, res, next) {
  // TODO: Build/handle HTTP errors (e.g. Express, csurf)
  //   Make sure we have a POST error generator when csurf is patched
  //   Move it into its own `handleHttpError` controller
  // For the interim:
  // If we have an HTTP status code, then pass it on to Express' default error handler
  // https://github.com/getsentry/raven-node/blob/0.12.0/lib/middleware/connect.js#L16
  if (err.status || err.statusCode || err.status_code) {
    return next(err);
  }

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
  var renderMessage = 'We encountered an unexpected error. ' +
    'The development team has been notified and it should be fixed promptly.';
  try {
    res.status(500).render('error.jade', {
      message: renderMessage,
      title: 'Error encountered'
    });
  } catch (renderErr) {
    // Log and report our render error
    // TODO: Use actual Winston client
    app.notWinston.error(err);
    app.sentryClient.captureError(renderErr, sentryKwargs);

    // Send a text only response
    res.status(500).set('Content-Type', 'text/plain').send(renderMessage);
  }
});
