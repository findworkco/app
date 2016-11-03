// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var Application = require('../../../server/models/application.js');

// Start our tests
describe('A Base model', function () {
  it.skip('has timestamp fields', function () {
    var base = Application.build({});
    expect(base.get('created_at')).to.not.equal(undefined);
    expect(base.get('updated_at')).to.not.equal(undefined);
  });
});

// These should be possible with hooks
// http://docs.sequelizejs.com/en/v3/api/hooks/
describe('A Base model being created', function () {
  it.skip('is saved to an audit log', function () {
    // Assert source user, table, id, previous, and new data
  });
});
describe('A Base model being updated', function () {
  it.skip('is saved to an audit log', function () {
    // Assert source user, table, id, previous, and new data
  });
});
describe('A Base model being deleted', function () {
  it.skip('is saved to an audit log', function () {
    // Assert source user, table, id, previous, and new data
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
    it.skip('errors out', function () {
      // Utilize validation to verify timezone validity
    });
  });
});
