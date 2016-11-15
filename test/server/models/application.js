// Load in our dependencies
var expect = require('chai').expect;
var Application = require('../../../server/models/application.js');

// Start our tests
describe('An Application model with an empty name', function () {
  it('receives a validation error', function (done) {
    var application = Application.build({name: '', notes: '', status: 'saved_for_later'});
    application.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'name');
      expect(validationErr.errors[0]).to.have.property('message', 'Name cannot be empty');
      done();
    });
  });
});

describe('An Application model with an invalid status', function () {
  it('receives a validation error', function (done) {
    var application = Application.build({name: 'Mock company', notes: '', status: 'invalid_status'});
    application.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'status');
      expect(validationErr.errors[0]).to.have.property('message', 'Invalid status provided');
      done();
    });
  });
});
