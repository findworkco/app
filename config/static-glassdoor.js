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
    timeout: 1000, // 1 second
    url: {
      protocol: 'https',
      hostname: 'www.glassdoor.com'
    },
    partnerId: '55428',
    key: PRODUCTION_KEY
  }
};

var TEST_GLASSDOOR_PORT = 7001;
exports.test = {
  fakeGlassdoor: {
    port: TEST_GLASSDOOR_PORT
  },
  glassdoor: {
    timeout: 10, // 10ms
    url: {
      protocol: 'http',
      hostname: 'localhost',
      port: TEST_GLASSDOOR_PORT
    },
    partnerId: 'mock-partner-id',
    key: 'mock-key'
  }
};

exports.production = {
  glassdoor: exports.development.glassdoor
};
