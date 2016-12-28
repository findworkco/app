// Load in our dependencies
var assert = require('assert');
var staticSecrets = require('./static-secrets');

// Define our configurations
exports.common = {
};

var PRODUCTION_KEY = staticSecrets.staticGlassdoor.productionKey;
assert(PRODUCTION_KEY);
exports.development = {
  glassdoor: {
    partnerId: '55428',
    key: PRODUCTION_KEY
  }
};

exports.test = {
  // Not set up/tested but should be based on `development`
};

exports.production = {
  glassdoor: exports.development.glassdoor
};
