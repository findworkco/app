// Load in our dependencies
var connectEnsureLogin = require('connect-ensure-login');

// Define our middleware
// https://github.com/jaredhanson/connect-ensure-login/blob/v0.1.1/lib/ensureLoggedIn.js
exports.ensureLoggedIn = connectEnsureLogin.ensureLoggedIn({
  redirectTo: '/login', // Redirect to `/login`
  setReturnTo: true // Saves `req.session.returnTo = req.originalUrl || req.url;`
});
