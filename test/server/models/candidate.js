// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var Candidate = require('../../../server/models/candidate.js');

// Start our tests
describe('A Candidate model', function () {
  it('requires `email` to be an email', function (done) {
    var candidate = Candidate.build({email: 'foo'});
    candidate.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'email');
      expect(validationErr.errors[0]).to.have.property('message', 'Invalid email provided');
      done();
    });
  });
});

describe('candidates table', function () {
  it('has expected relationships', function (done) {
    // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/model.js#L996-L1005
    Candidate.QueryInterface.showIndex('candidates').asCallback(function handleQuery (err, indexes) {
      expect(err).to.equal(null);

      var idIndex = _.findWhere(indexes, {name: 'candidates_pkey'});
      expect(idIndex.primary).to.equal(true);
      expect(idIndex.unique).to.equal(true);
      expect(_.pluck(idIndex.fields, 'attribute')).to.deep.equal(['id']);

      var emailIndex = _.findWhere(indexes, {name: 'candidates_email_key'});
      expect(emailIndex.unique).to.equal(true);
      expect(_.pluck(emailIndex.fields, 'attribute')).to.deep.equal(['email']);
      done();
    });
  });
});
