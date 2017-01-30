// Load in our dependencies
var app = require('../index.js').app;
var queue = require('../queue');

// Define our controllers
// Test via: curl http://localhost:9000/error/sync-error
// Test via: curl "http://localhost:9000/error/sync-error?foo=bar&foo=baz"
app.get('/error/sync-error', function syncErrorShow (req, res, next) {
  throw new Error('Sync error');
});
// Test via: curl http://localhost:9000/error/async-error
app.get('/error/async-error', function asyncErrorShow (req, res, next) {
  setTimeout(function handleSetTimeout () {
    throw new Error('Async error (get)');
  }, 100);
});
app.all('/error/async-error/all', function asyncErrorAllShow (req, res, next) {
  setTimeout(function handleSetTimeout () {
    throw new Error('Async error (all)');
  }, 100);
});
app.use('/error/async-error/use', function asyncErrorUseShow (req, res, next) {
  setTimeout(function handleSetTimeout () {
    throw new Error('Async error (use)');
  }, 100);
});
app.get('/error/non-critical-error', function nonCriticalErrorShow (req, res, next) {
  var err = Error('Non critical error');
  req.captureError(err);
  res.send('Non-critical error captured');
});
// Test via: curl http://localhost:9000/error/queue/failure
app.get('/error/queue/failure', [
  function queueFailureShow (req, res, next) {
    queue.create(queue.JOBS.GENERATE_FAILURE_ERROR, {
      title: 'queueFailureError'
    }).save(next);
  },
  function sendResponse (req, res, next) {
    res.send('OK');
  }
]);
// Test via: curl http://localhost:9000/error/queue/sync-error
app.get('/error/queue/sync-error', [
  function queueSyncErrorShow (req, res, next) {
    queue.create(queue.JOBS.GENERATE_SYNC_ERROR, {
      title: 'queueSyncError'
    }).save(next);
  },
  function sendResponse (req, res, next) {
    res.send('OK');
  }
]);
// Test via: curl http://localhost:9000/error/queue/async-error
app.get('/error/queue/async-error', [
  function asyncErrorShow (req, res, next) {
    queue.create(queue.JOBS.GENERATE_ASYNC_ERROR, {
      title: 'queueAsyncError'
    }).save(next);
  },
  function sendResponse (req, res, next) {
    res.send('OK');
  }
]);

// jscs:disable maximumLineLength
// Test via:
//   # Grab and parse our response
//   settings_response="$(curl --silent --include http://localhost:9000/settings)"
//   # headers + HTML -> set-cookie: sid=... -> sid=...
//   sid_cookie="$(echo "$settings_response" | grep set-cookie | sed -E "s/.*(sid=[^;]+).*/\1/")"
//   # headers + HTML -> <input name="x-csrf-token" value="..."> -> ... (csrf value)
//   csrf_token="$(echo "$settings_response" | tr "<" "\n" | grep x-csrf-token | head -n 1 | sed -E "s/.*value=\"([^\"]+).*/\1/")"
//   # Send our HTTP test
//   curl http://localhost:9000/error/post-error -X POST --data "foo=bar&x-csrf-token=$csrf_token" --cookie "$sid_cookie"
// DEV: We want to use `--cookie-jar` but `curl` is having domain issues with `localhost:9000`
// jscs:enable maximumLineLength
app.post('/error/post-error', function postErrorShow (req, res, next) {
  throw new Error('POST error');
});
// Test via: curl http://localhost:9000/error/use-error
app.use('/error/use-error', function useErrorShow (req, res, next) {
  throw new Error('`.use()` error');
});
