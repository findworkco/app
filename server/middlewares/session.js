// Load in our dependencies
var connectEnsureLogin = require('connect-ensure-login');

// Define our middleware
// https://github.com/jaredhanson/connect-ensure-login/blob/v0.1.1/lib/ensureLoggedIn.js
var _getEnsureLoggedIn = connectEnsureLogin.ensureLoggedIn({
  redirectTo: '/login', // Redirect to `/login`
  setReturnTo: true // Saves `req.session.returnTo = req.originalUrl || req.url;`
});
var _postEnsureLoggedIn = connectEnsureLogin.ensureLoggedIn({
  redirectTo: '/login', // Redirect to `/login`
  setReturnTo: false // Don't save original URL for POST requests (otherwise we redirect to its normal page)
});
exports.ensureLoggedIn = function (req, res, next) {
  if (req.method === 'GET') {
    return _getEnsureLoggedIn.call(this, req, res, next);
  } else {
    return _postEnsureLoggedIn.call(this, req, res, next);
  }
};
