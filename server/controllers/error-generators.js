// Load in our dependencies
var app = require('../index.js').app;

// Define our controllers
// Test via: curl http://localhost:9000/errors/sync-error
// Test via: curl "http://localhost:9000/errors/sync-error?foo=bar&foo=baz"
app.get('/errors/sync-error', function syncErrorShow (req, res, next) {
  throw new Error('Sync error');
});
// Test via: curl http://localhost:9000/errors/async-error
app.get('/errors/async-error', function asyncErrorShow (req, res, next) {
  setTimeout(function handleSetTimeout () {
    throw new Error('Async error');
  }, 100);
});
// Test via: curl http://localhost:9000/errors/post-error -X POST --data "foo=bar"
app.post('/errors/post-error', function postErrorShow (req, res, next) {
  throw new Error('POST error');
});
// Test via: curl http://localhost:9000/errors/use-error
app.use('/errors/use-error', function useErrorShow (req, res, next) {
  throw new Error('`.use()` error');
});
