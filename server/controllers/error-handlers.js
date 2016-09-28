// Load in our dependencies
var jsonStringifySafe = require('json-stringify-safe');
var sentryParsers = require('raven/lib/parsers');
var app = require('../index.js').app;

// Define our controllers
app.use(function handleError (err, req, res, next) {
  // TODO: Build/handle HTTP errors (e.g. Express, csurf)
  //   Make sure we have a POST error generator when csurf is patched
  // For the interim:
  // If we have an HTTP status code, then pass it on to Express' default error handler
  // https://github.com/getsentry/raven-node/blob/0.12.0/lib/middleware/connect.js#L16
  if (err.status || err.statusCode || err.status_code) {
    return next(err);
  }

  // Prepare and send our request for Sentry
  // https://github.com/getsentry/raven-node/blob/0.12.0/lib/middleware/connect.js#L21-L25
  // DEV: We overwrite `query` and `data` with the format Raven expects
  //   https://github.com/getsentry/raven-node/blob/0.12.0/lib/parsers.js#L112-L160
  //   https://docs.sentry.io/hosted/clientdev/interfaces/#special-interfaces
  // TODO: Add user information to sentryKwargs (e.g. email)
  // DEV: `captureError` allows for a callback with the Sentry id but we don't use/need it
  var sentryKwargs = sentryParsers.parseRequest(req);
  sentryKwargs.request.query_string = req._parsedOriginalUrl.query;
  sentryKwargs.request.data = jsonStringifySafe(req.body.toObject());
  app.sentryClient.captureError(err, sentryKwargs);

  // Render an error page
  // TODO: Render content on an actual page
  res.status(500).send('We encountered an unexpected error. ' +
    'The development team has been notified and it should be fixed promptly.');
});
