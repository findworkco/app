// Load in dependencies
var assert = require('assert');
var app = require('../');

// Start our tests
describe('app', function () {
  it('returns awesome', function () {
    assert.strictEqual(app(), 'awesome');
  });
});
