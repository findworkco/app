// Load in our dependencies
var expect = require('chai').expect;
var Application = require('../../../server/models/application.js');

// Start our tests
describe('An Application model', function () {
  it.skip('requires `name` to be non-empty', function () {
    var application = Application.build({});
    expect(application).to.equal(false);
  });

  it.skip('requires `status` to be valid', function () {
    var application = Application.build({});
    expect(application).to.equal(false);
  });
});
