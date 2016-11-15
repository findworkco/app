// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var AuditLog = require('../../../server/models/audit-log.js');
var Application = require('../../../server/models/application.js');
var Candidate = require('../../../server/models/candidate.js');
var scenario = require('../utils/test').scenario;

// Start our tests
describe('A Base model', function () {
  it('has timestamp fields', function () {
    expect(Application.attributes).to.have.property('created_at');
    expect(Application.attributes).to.have.property('updated_at');
  });
});

scenario('A Base model being created', {
  dbFixtures: [],
  googleFixtures: null
}, function () {
  before(function createCandidate (done) {
    var candidate = Candidate.build({email: 'mock-email@mock-domain.test'});
    candidate.save({_sourceType: 'server'}).asCallback(done);
  });

  it('is saved to an audit log', function (done) {
    // Assert source user, table, id, previous, and new data
    AuditLog.findAll().asCallback(function handleAuditLogs (err, auditLogs) {
      if (err) { return done(err); }
      expect(auditLogs).to.have.length(1);
      expect(auditLogs[0].get('source_type')).to.equal('server');
      expect(auditLogs[0].get('source_id')).to.equal(null);
      expect(auditLogs[0].get('table_name')).to.equal('candidates');
      expect(auditLogs[0].get('table_row_id')).to.be.a('String');
      expect(auditLogs[0].get('action')).to.equal('create');
      expect(auditLogs[0].get('timestamp')).to.be.a('Date');
      expect(auditLogs[0].get('previous_values')).to.deep.equal({});
      expect(auditLogs[0].get('current_values')).to.have.property('email',
        'mock-email@mock-domain.test');
      done();
    });
  });
});

scenario('A Base model being updated', {
  dbFixtures: ['candidate-default'],
  googleFixtures: null
}, function () {
  before(function updateCandidate (done) {
    Candidate.find().asCallback(function handleFind (err, candidate) {
      if (err) { return done(err); }
      candidate.update({
        email: 'mock-email2@mock-domain2.test'
      }, {
        _sourceType: 'candidates',
        _sourceId: candidate.get('id')
      }).asCallback(done);
    });
  });

  it('is saved to an audit log', function (done) {
    // Assert source user, table, id, previous, and new data
    AuditLog.findAll({where: {source_type: 'candidates'}}).asCallback(function handleAuditLogs (err, auditLogs) {
      if (err) { return done(err); }
      expect(auditLogs).to.have.length(1);
      expect(auditLogs[0].get('source_type')).to.equal('candidates');
      expect(auditLogs[0].get('source_id')).to.be.a('String');
      expect(auditLogs[0].get('table_name')).to.equal('candidates');
      expect(auditLogs[0].get('table_row_id')).to.be.a('String');
      expect(auditLogs[0].get('action')).to.equal('update');
      expect(auditLogs[0].get('timestamp')).to.be.a('Date');
      expect(auditLogs[0].get('previous_values')).to.have.property('email',
        'mock-email@mock-domain.test');
      expect(auditLogs[0].get('current_values')).to.have.property('email',
        'mock-email2@mock-domain2.test');
      done();
    });
  });
});

scenario('A Base model being deleted', {
  dbFixtures: ['candidate-default'],
  googleFixtures: null
}, function () {
  before(function deleteCandidate (done) {
    Candidate.find().asCallback(function handleFind (err, candidate) {
      if (err) { return done(err); }
      candidate.destroy({
        _sourceType: 'candidates',
        _sourceId: candidate.get('id')
      }).asCallback(done);
    });
  });

  it('is saved to an audit log', function (done) {
    // Assert source user, table, id, previous, and new data
    AuditLog.findAll({where: {source_type: 'candidates'}}).asCallback(function handleAuditLogs (err, auditLogs) {
      if (err) { return done(err); }
      expect(auditLogs).to.have.length(1);
      expect(auditLogs[0].get('source_type')).to.equal('candidates');
      expect(auditLogs[0].get('source_id')).to.be.a('String');
      expect(auditLogs[0].get('table_name')).to.equal('candidates');
      expect(auditLogs[0].get('table_row_id')).to.be.a('String');
      expect(auditLogs[0].get('action')).to.equal('delete');
      expect(auditLogs[0].get('timestamp')).to.be.a('Date');
      expect(auditLogs[0].get('previous_values')).to.have.property('email',
        'mock-email@mock-domain.test');
      expect(auditLogs[0].get('current_values')).to.have.property('email',
        'mock-email@mock-domain.test');
      done();
    });
  });
});

// http://docs.sequelizejs.com/en/v3/docs/instances/#working-in-bulk-creating-updating-and-destroying-multiple-rows-at-once
scenario('A Base model being bulk created', {
  dbFixtures: [],
  googleFixtures: null
}, function () {
  it('is rejected due to lack of support', function (done) {
    Candidate.bulkCreate([
      {email: 'mock-email@mock-domain.test'}
    ]).asCallback(function handleBulkCreate (err, candidates) {
      expect(err.message).to.contain('Audit logging not supported for bulk creation');
      done();
    });
  });
});
scenario('A Base model being bulk updated', {
  dbFixtures: [],
  googleFixtures: null
}, function () {
  it('is rejected due to lack of support', function (done) {
    Candidate.update({
      email: 'mock-email2@mock-domain2.test'
    }, {
      where: {email: 'mock-email@mock-domain.test'}
    }).asCallback(function handleBulkUpdate (err, candidates) {
      expect(err.message).to.contain('Audit logging not supported for bulk updates');
      done();
    });
  });
});
scenario('A Base model being bulk deleted', {
  dbFixtures: [],
  googleFixtures: null
}, function () {
  it('is rejected due to lack of support', function (done) {
    Candidate.destroy({
      where: {email: 'mock-email@mock-domain.test'}
    }).asCallback(function handleBulkDelete (err, candidates) {
      expect(err.message).to.contain('Audit logging not supported for bulk deletion');
      done();
    });
  });
});

// DEV: Test is currently skipped due to no applications in database
scenario.skip('A Base model being created with a candidate source', {
  dbFixtures: [],
  googleFixtures: null
}, function () {
  before(function createApplication (done) {
    var application = Application.build({name: 'Candidate source application'});
    application._sourceType = 'candidates';
    application._sourceId = 'mock-candidate-id';
    application.save().asCallback(done);
  });

  it('saves candidate source to its audit log', function (done) {
    AuditLog.findAll().asCallback(function handleAuditLogs (err, auditLogs) {
      if (err) { return done(err); }
      expect(auditLogs).to.have.length(1);
      expect(auditLogs[0].get('source_type')).to.equal('candidates');
      expect(auditLogs[0].get('source_id')).to.equal('mock-candidate-id');
      done();
    });
  });
});

describe('A Base model with a moment-based dateonly field', function () {
  describe('when date is null', function () {
    it('returns null as moment', function () {
      var base = Application.build({application_date_date: null});
      expect(base.get('application_date_moment')).to.equal(null);
    });
  });

  describe('when date is not null', function () {
    it('returns a moment instance', function () {
      // http://momentjs.com/docs/#/query/is-same/
      var base = Application.build({application_date_date: new Date('2016-02-05')});
      expect(base.get('application_date_moment').isSame(moment('2016-02-05'))).to.equal(true);
    });
  });

  describe('when updating moment to null', function () {
    it('has null as date', function () {
      var base = Application.build({application_date_date: new Date('2016-02-05')});
      base.set('application_date_moment', null);
      expect(base.get('application_date_date')).to.equal(null);
    });
  });

  describe('when updating moment to not null', function () {
    it('has a date', function () {
      var base = Application.build({application_date_date: null});
      base.set('application_date_moment', moment('2016-02-05'));
      expect(base.get('application_date_date')).to.deep.equal(new Date('2016-02-05'));
    });
  });
});

describe('A Base model with a moment-based datetime/timezone field', function () {
  describe('when datetime and timezone are null', function () {
    it('returns null as moment', function () {
      var base = Application.build({
        archived_at_datetime: null,
        archived_at_timezone: null
      });
      expect(base.get('archived_at_moment')).to.equal(null);
    });
  });

  describe('when datetime and timezone are not null', function () {
    it('returns a moment instance', function () {
      var base = Application.build({
        archived_at_datetime: new Date('2016-02-05T14:00:00Z'),
        archived_at_timezone: 'America/Chicago'
      });
      var expectedMoment = moment.tz('2016-02-05T14:00:00Z', 'America/Chicago');
      expect(base.get('archived_at_moment').isSame(expectedMoment)).to.equal(true);
    });
  });

  describe('when datetime is null but timezone isn\'t', function () {
    it('errors out on moment `get`', function () {
      var base = Application.build({
        archived_at_datetime: null,
        archived_at_timezone: 'America/Chicago'
      });
      expect(function getArchivedAtMoment () {
        base.get('archived_at_moment');
      }).to.throw(/Expected "archived_at_datetime" to not be null/);
    });
    it.skip('errors out when loaded via query', function () {
      // Verify this when loaded from database (validation)
    });
    it.skip('errors out when saved to database', function () {
      // Verify this when saved to database (validation)
    });
  });

  describe('when datetime isn\'t null but timezone is', function () {
    it('errors out on moment `get`', function () {
      var base = Application.build({
        archived_at_datetime: null,
        archived_at_timezone: 'America/Chicago'
      });
      expect(function getArchivedAtMoment () {
        base.get('archived_at_moment');
      }).to.throw(/Expected "archived_at_datetime" to not be null/);
    });
    it.skip('errors out when loaded via query', function () {
      // Verify this when loaded from database (validation)
    });
    it.skip('errors out when saved to database', function () {
      // Verify this when saved to database (validation)
    });
  });

  describe('when updating moment to null', function () {
    it('has null as datetime and timezone', function () {
      var base = Application.build({
        archived_at_datetime: new Date('2016-02-05T14:00:00Z'),
        archived_at_timezone: 'America/Chicago'
      });
      base.set('archived_at_moment', null);
      expect(base.get('archived_at_datetime')).to.equal(null);
      expect(base.get('archived_at_timezone')).to.equal(null);
    });
  });

  describe('when updating moment to not null', function () {
    it('has a datetime and timezone', function () {
      var base = Application.build({
        archived_at_datetime: null,
        archived_at_timezone: null
      });
      // DEV: We exclude `Z` suffix which indicates UTC and offset time appropriately for America/Chicago
      base.set('archived_at_moment', moment.tz('2016-02-05T08:00:00', 'America/Chicago'));
      expect(base.get('archived_at_datetime')).to.deep.equal(new Date('2016-02-05T14:00:00Z'));
      expect(base.get('archived_at_timezone')).to.equal('America/Chicago');
    });
  });

  describe('when updating moment to a moment without a timezone', function () {
    it('errors out about lack of timezone', function () {
      var base = Application.build({
        archived_at_datetime: null,
        archived_at_timezone: null
      });
      expect(function getArchivedAtMoment () {
        base.set('archived_at_moment', moment('2016-02-05T14:00:00Z'));
      }).to.throw(/Expected timezone to be set for "archived_at_moment"/);
    });
  });

  describe('when updating timezone to invalid timezone', function () {
    it('errors out', function (done) {
      var base = Application.build({
        name: 'invalid-timezone-app',
        status: 'waiting_for_response',
        archived_at_datetime: new Date('2016-02-05T14:00:00Z'),
        archived_at_timezone: 'America/Nowhere'
      });
      base.validate().asCallback(function handleError (err, validationErr) {
        expect(err).to.equal(null);
        expect(validationErr.errors).to.have.length(1);
        expect(validationErr.errors[0]).to.have.property('path', 'archived_at_timezone');
        expect(validationErr.errors[0]).to.have.property('message', 'Invalid timezone provided');
        done();
      });
    });
  });
});
