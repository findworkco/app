// Load in our dependencies
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var bodyParserMultiDict = require('body-parser-multidict');
var SpyServerFactory = require('spy-server');
var dbFixtures = require('./db-fixtures');
var config = require('./server').config;
var serverUtils = require('./server');

// Generate our server and set up fixtures
var fakeGoogleFactory = new SpyServerFactory({port: config.fakeGoogle.port});

// Define default fixtures
// DEV: We don't include `/o/oauth2/v2/auth` as `code` should reflect chosen user
fakeGoogleFactory.DEFAULT_FIXTURES = [
  '/oauth2/v4/token#valid-code',
  '/plus/v1/people/me#valid-access-token'
];

// https://github.com/jaredhanson/passport-google-oauth2/blob/v1.0.0/lib/strategy.js#L49
// Fixture for: https://accounts.google.com/o/oauth2/v2/auth
fakeGoogleFactory.addFixture('/o/oauth2/v2/auth#valid', {
  method: 'get',
  route: '/o/oauth2/v2/auth',
  response: function (req, res) {
    // Fake request obtained via:
    //   console.log(req.url, req.headers);
    // Strip away external host info for redirect URL
    //   https://findwork.test/oauth/google/callback?action=login
    //   -> /oauth/google/callback?action=login
    var redirectUrl = url.parse(req.query.redirect_uri, true);
    redirectUrl = _.pick(redirectUrl, ['pathname', 'query']);

    // Add on valid state and code placeholder
    // DEV: Other fixtures will take care of considering code valid/not
    redirectUrl.query = _.extend(redirectUrl.query, {
      code: dbFixtures.CANDIDATE_DEFAULT, // Use db fixture key as code
      state: req.query.state
    });

    // Complete our redirect
    res.redirect(serverUtils.getUrl(redirectUrl));
  }
});

// https://github.com/jaredhanson/passport-google-oauth2/blob/v1.0.0/lib/strategy.js#L50
// https://github.com/ciaranj/node-oauth/blob/0.9.14/lib/oauth2.js#L176
// Fixture for: https://www.googleapis.com/oauth2/v4/token
fakeGoogleFactory.addFixture('/oauth2/v4/token#invalid-code', {
  method: 'post',
  route: '/oauth2/v4/token',
  response: function (req, res) {
    // jscs:disable maximumLineLength
    // Fake request obtained via:
    //   console.log(req.url, req.headers);
    //   req.on('data', function (buff) { console.log(buff.toString('utf8')); });
    // Then running a curl:
    //   set -u # Notify ourselves of unset variables
    //   ESCAPED_REDIRECT_URI="http%3A%2F%2Flocalhost%3A9000%2Foauth%2Fgoogle%2Fcallback%3Faction%3Dlogin"
    //   CLIENT_ID="607344720024-pm4njq4mcs2bphtj90vmcd4mqu1fkao0.apps.googleusercontent.com"
    //   CLIENT_SECRET="qT4wm_4xh2LwlVFoZFZlSVgu"
    //   curl --include -X POST "https://www.googleapis.com/oauth2/v4/token" --data "grant_type=authorization_code&redirect_uri=$ESCAPED_REDIRECT_URI&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code=invalid_code"
    // jscs:enable maximumLineLength
    res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Bad Request'
    });
  }
});

fakeGoogleFactory.addFixture('/oauth2/v4/token#valid-code', {
  method: 'post',
  route: '/oauth2/v4/token',
  response: [
    bodyParserMultiDict.urlencoded(),
    function (req, res) {
      // Intercepted by adding a `console.log` in `oauth/lib/oauth2.js` and performing normal login via UI
      //   https://github.com/ciaranj/node-oauth/blob/0.9.14/lib/oauth2.js#L183
      //   console.log(data);
      // Pass along code as access token
      // DEV: We don't use the fixtured access token so we can test it gets updated properly
      var code = req.body.fetch('code');
      res.status(200).json({
        access_token: 'mock_access_token|' + code,
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: 'mock_id_token'
      });
    }
  ]
});

// https://github.com/jaredhanson/passport-google-oauth2/blob/v1.0.0/lib/strategy.js#L54
// https://github.com/jaredhanson/passport-google-oauth2/blob/v1.0.0/lib/strategy.js#L84
// Fixture for: https://www.googleapis.com/plus/v1/people/me
fakeGoogleFactory.addFixture('/plus/v1/people/me#invalid-access-token', {
  method: 'get',
  route: '/plus/v1/people/me',
  response: function (req, res) {
    // Fake request obtained via:
    //   console.log(req.url, req.headers);
    //   req.on('data', function (buff) { console.log(buff.toString('utf8')); });
    //   set -u # Notify ourselves of unset variables
    // Then running a curl:
    //   curl --include -X GET "https://www.googleapis.com/plus/v1/people/me?access_token=mock_access_token"
    res.status(403).json({
      error: {
        errors: [{
          domain: 'usageLimits',
          reason: 'dailyLimitExceededUnreg',
          message: 'Daily Limit for Unauthenticated Use Exceeded. Continued use requires signup.',
          extendedHelp: 'https://code.google.com/apis/console'
        }],
        code: 403,
        message: 'Daily Limit for Unauthenticated Use Exceeded. Continued use requires signup.'
      }
    });
  }
});

function getValidMeInfo(email) {
  return {
    kind: 'plus#person',
    etag: '"mock-etag"',
    emails: [{
      value: email,
      type: 'account'
    }],
    objectType: 'person',
    id: '1234567890',
    displayName: '',
    name: {
      familyName: '',
      givenName: ''
    },
    image: {
      url: 'https://mock-googleusercontent.test/mock/photo.jpg?sz=50',
      isDefault: false
    },
    isPlusUser: false,
    circledByCount: 0,
    verified: false,
    domain: 'mock-domain.test'
  };
}
fakeGoogleFactory.addFixture('/plus/v1/people/me#valid-access-token', {
  method: 'get',
  route: '/plus/v1/people/me',
  response: function (req, res) {
    // Intercepted by adding a `console.log` in `oauth/lib/oauth2.js` and performing normal login via UI
    //   https://github.com/jaredhanson/passport-google-oauth2/blob/v1.0.0/lib/strategy.js#L103
    //   console.log(body);
    var accessToken = req.query.access_token; assert(accessToken);
    var candidateKey = accessToken.replace('mock_access_token|', '');
    var candidate = dbFixtures[candidateKey];
    assert(candidate, 'Unable to find candidate by key "' + candidateKey + '" (token: ' + accessToken + ')');
    res.status(200).json(getValidMeInfo(candidate.data.email));
  }
});
fakeGoogleFactory.addFixture('/plus/v1/people/me#only-matching-id', {
  method: 'get',
  route: '/plus/v1/people/me',
  response: function (req, res) {
    res.status(200).json(getValidMeInfo('only-matching-id@mock-domain.test'));
  }
});

fakeGoogleFactory.addFixture('/plus/v1/people/me#no-account-email', {
  method: 'get',
  route: '/plus/v1/people/me',
  response: function (req, res) {
    res.status(200).json(_.defaults({
      emails: []
    }, getValidMeInfo('')));
  }
});

// Export our factory
module.exports = fakeGoogleFactory;
