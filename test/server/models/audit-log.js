// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var AuditLog = require('../../../server/models/audit-log.js');

// Start our tests
describe('An audit log', function () {
  it('doesn\'t have created_at/updated_at timestamps', function () {
    expect(AuditLog.attributes).to.not.have.property('created_at');
    expect(AuditLog.attributes).to.not.have.property('updated_at');
  });

  it('has a generic timestamp', function () {
    expect(AuditLog.attributes).to.have.property('timestamp');
  });
});

var goodAuditLog = {
  source_type: AuditLog.SOURCE_SERVER,
  action: 'create',
  table_name: 'candidates',
  table_row_id: 'mock-candidate-uuid',
  timestamp: new Date()
};
describe.only('An audit log with an invalid action', function () {
  it('receives validation errors', function (done) {
    var auditLog = AuditLog.build(_.defaults({
      action: 'invalid-action'
    }, goodAuditLog));
    auditLog.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      console.log(validationErr.errors);
      // expect(validationErr.errors).to.have.length(1);
      // expect(validationErr.errors[0]).to.have.property('path', 'action');
      // expect(validationErr.errors[0]).to.have.property('message', 'Action must be create, update, or delete');
      done();
    });
  });
});
