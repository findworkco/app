// Load in our dependencies
var url = require('url');
var _ = require('underscore');
var app = require('../index.js').app;
var config = require('../index.js').config;

// Define our controllers
// DEV: Scope can be reset during development via
//   https://security.google.com/settings/security/permissions
var callbackUrl =  url.format(_.defaults({
  pathname: '/oauth/google/callback'
}, config.url.external));
app.get('/oauth/google/request', function oauthGoogleRequestShow (req, res, next) {
  // TODO: Fill with proper content
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth' +
    '?response_type=code&redirect_uri=' + encodeURIComponent(callbackUrl) +
    '&scope=email&client_id=' + encodeURIComponent(config.google.clientID));
});
app.get('/oauth/google/callback', function oauthGoogleCallbackShow (req, res, next) {
  // TODO: Fill with proper content
  res.redirect('/schedule');
});
