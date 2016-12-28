// Load in our dependencies
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Define our configurations
exports.common = {
  // No common setup
};

var DEVELOPMENT_SECRET = staticSecrets.staticAngelList.developmentSecret;
assert(DEVELOPMENT_SECRET);
exports.development = {
  angellist: {
    clientId: 'ca1115b929bcca0a440ba4b58e160e7a58b2bdef1df70ac6',
    clientSecret: DEVELOPMENT_SECRET
  }
};

exports.test = {
  // Not set up/tested but should be based on AngelList
};

exports.production = {
  // Not set up/tested but can be added at: https://angel.co/api/oauth/clients
};
