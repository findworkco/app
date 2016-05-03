// Taken from https://gist.github.com/twolfson/3af2ed0a016f877d676d
// Load in our dependencies
var _ = require('underscore');
var request = require('request');
var _httpUtils = require('request-mocha')(request);

// Copy over utilities from request-mocha
_.extend(exports, _httpUtils);
