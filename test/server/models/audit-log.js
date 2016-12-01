// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var AuditLog = require('../../../server/models/audit-log.js');

// Start our tests
scenario.model('An audit log', function () {
  it('doesn\'t have created_at/updated_at timestamps', function () {
    expect(AuditLog.attributes).to.not.have.property('created_at');
    expect(AuditLog.attributes).to.not.have.property('updated_at');
  });

  it('has a generic timestamp', function () {
    expect(AuditLog.attributes).to.have.property('timestamp');
  });
});

var validAuditLog = {
  source_type: 'server',
  action: 'create',
  table_name: 'candidates',
  table_row_id: 'mock-candidate-uuid',
  timestamp: new Date(),
  previous_values: {},
  current_values: {}
};
scenario.model('A valid audit log', function () {
  it('receives no validation errors', function (done) {
    var auditLog = AuditLog.build(_.clone(validAuditLog));
    auditLog.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});
scenario.model('An audit log with an invalid source', function () {
  it('receives validation errors', function (done) {
    var auditLog = AuditLog.build(_.defaults({
      source_type: 'invalid-source'
    }, validAuditLog));
    auditLog.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors.length).to.be.at.least(1);
      expect(validationErr.errors[1]).to.have.property('path', 'source_type');
      expect(validationErr.errors[1]).to.have.property('message', 'Source must be server or candidates');
      done();
    });
  });
});
scenario.model('An audit log with an non-server source and no id', function () {
  it('receives validation errors', function (done) {
    var auditLog = AuditLog.build(_.defaults({
      source_type: 'candidates'
    }, validAuditLog));
    auditLog.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'requireSourceId');
      expect(validationErr.errors[0]).to.have.property('message',
        'source_id required for non-server/non-queue sources in audit log');
      done();
    });
  });
});
scenario.model('An audit log with an non-server source and an id', function () {
  it('receives no validation errors', function (done) {
    var auditLog = AuditLog.build(_.defaults({
      source_type: 'candidates',
      source_id: 'mock-candidate-id'
    }, validAuditLog));
    auditLog.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});
scenario.model('An audit log with an invalid action', function () {
  it('receives validation errors', function (done) {
    var auditLog = AuditLog.build(_.defaults({
      action: 'invalid-action'
    }, validAuditLog));
    auditLog.validate().asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'action');
      expect(validationErr.errors[0]).to.have.property('message', 'Action must be create, update, or delete');
      done();
    });
  });
});
