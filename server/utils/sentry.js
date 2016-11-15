// Load in our dependencies
var jsonStringifySafe = require('json-stringify-safe');
var sentryParsers = require('raven/lib/parsers');

// Define our exports
exports.parseRequest = function (req) {
  // Resolve our variant of Sentry's parseRequest
  // https://github.com/getsentry/raven-node/blob/0.12.0/lib/middleware/connect.js#L21-L25
  // https://docs.sentry.io/clientdev/interfaces/user/
  // DEV: We overwrite `query` and `data` with the format Raven expects
  //   https://github.com/getsentry/raven-node/blob/0.12.0/lib/parsers.js#L112-L160
  //   https://docs.sentry.io/hosted/clientdev/interfaces/#special-interfaces
  // DEV: `captureError` allows for a callback with the Sentry id but we don't use/need it
  // DEV: `req.body` might not be defined if we encounter a 500 error before parsing it
  var sentryKwargs = sentryParsers.parseRequest(req, {
    user: {id: req.candidate ? req.candidate.get('id') : null}
  });
  sentryKwargs.request.query_string = req._parsedUrl.query;
  sentryKwargs.request.data = req.body ? jsonStringifySafe(req.body.toObject()) : 'Unknown';
  return sentryKwargs;
};
