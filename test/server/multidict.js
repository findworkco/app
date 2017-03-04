// Load in our dependencies
var expect = require('chai').expect;
var HttpError = require('http-errors');
var MultiDictKeyError = require('querystring-multidict').MultiDictKeyError;
var MultiDict = require('../../server/utils/querystring-multidict').MultiDict;

// Start our tests
scenario('An extended MultiDict handling boolean data', {
  dbFixtures: null
}, function () {
  // getBoolean()
  it('gets truthy data as true', function () {
    var multidict = new MultiDict();
    multidict.add('foo', 'yes');
    expect(multidict.getBoolean('foo')).to.equal(true);
  });

  it('gets falsey data as false', function () {
    var multidict = new MultiDict();
    multidict.add('foo', 'no');
    expect(multidict.getBoolean('foo')).to.equal(false);
  });

  it('return a fallback when getting non-existent data', function () {
    var multidict = new MultiDict();
    expect(multidict.getBoolean('foo', 'fallback')).to.equal('fallback');
  });

  // fetchBoolean()
  it('fetches truthy data as true', function () {
    var multidict = new MultiDict();
    multidict.add('foo', 'yes');
    expect(multidict.fetchBoolean('foo')).to.equal(true);
  });

  it('fetches falsey data as false', function () {
    var multidict = new MultiDict();
    multidict.add('foo', 'no');
    expect(multidict.fetchBoolean('foo')).to.equal(false);
  });

  it('throws an error when fetching non-existent data', function () {
    var multidict = new MultiDict();
    expect(function () { multidict.fetchBoolean('foo'); }).to.throw(MultiDictKeyError);
  });
});

scenario('An extended MultiDict handling moment-dateonly data', {
  dbFixtures: null
}, function () {
  // getMomentDateOnly()
  it('gets moment-dateonly data as a moment instance', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    var momentInstance = multidict.getMomentDateOnly('foo_date');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });

  it('return a fallback when getting non-existent data', function () {
    var multidict = new MultiDict();
    expect(multidict.getMomentDateOnly('foo', 'fallback')).to.equal('fallback');
  });

  // fetchMomentDateOnly()
  it('fetches moment-timezone data as a moment instance', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    var momentInstance = multidict.fetchMomentDateOnly('foo_date');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });

  it('throws an error when fetching non-existent data', function () {
    var multidict = new MultiDict();
    expect(function () { multidict.fetchMomentDateOnly('foo_date'); }).to.throw(MultiDictKeyError);
  });

  // Normalization logic
  // https://www.w3.org/TR/2012/WD-html-markup-20120329/input.date.html#input.date.attrs.value
  it('accepts YYYY-MM-DD (HTML5 standard) date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    var momentInstance = multidict.getMomentDateOnly('foo_date');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });
  // DEV: We don't have to support these but it's quite simple with `moment`
  it('accepts YYYY/MM/DD (Europe) date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017/01/31');
    var momentInstance = multidict.getMomentDateOnly('foo_date');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });
  it('accepts MM-DD-YYYY (USA) date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '01-31-2017');
    var momentInstance = multidict.getMomentDateOnly('foo_date');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });

  // Edge case handling of invalid data
  it('doesn\'t support empty date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '');
    expect(multidict.getMomentDateOnly('foo_date')).to.equal(undefined);
    expect(multidict.getMomentDateOnly('foo_date', 'fallback')).to.equal('fallback');
    expect(function () { multidict.fetchMomentDateOnly('foo_date'); }).to.throw(HttpError.BadRequest);
  });
});

scenario('An extended MultiDict handling moment-timezone data', {
  dbFixtures: null
}, function () {
  // getMomentTimezone()
  it('gets moment-timezone data as a moment instance', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '13:00');
    multidict.add('foo_timezone', 'US-America/Chicago');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T19:00:00.000Z');
    expect(momentInstance.tz()).to.equal('US-America/Chicago');
  });

  it('return a fallback when getting non-existent data', function () {
    // All keys missing
    var multidict = new MultiDict();
    expect(multidict.getMomentTimezone('foo', 'fallback')).to.equal('fallback');
    // Missing date
    multidict = new MultiDict();
    multidict.add('foo_time', '13:00');
    multidict.add('foo_timezone', 'US-America/Chicago');
    expect(multidict.getMomentTimezone('foo', 'fallback')).to.equal('fallback');
    // Missing time
    multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_timezone', 'US-America/Chicago');
    expect(multidict.getMomentTimezone('foo', 'fallback')).to.equal('fallback');
    // Missing timezone
    multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '13:00');
    expect(multidict.getMomentTimezone('foo', 'fallback')).to.equal('fallback');
  });

  // fetchMomentTimezone()
  it('fetches moment-timezone data as a moment instance', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '13:00');
    multidict.add('foo_timezone', 'US-America/Chicago');
    var momentInstance = multidict.fetchMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T19:00:00.000Z');
    expect(momentInstance.tz()).to.equal('US-America/Chicago');
  });

  it('throws an error when fetching non-existent data', function () {
    // All keys missing
    var multidict = new MultiDict();
    expect(function () { multidict.fetchMomentTimezone('foo'); }).to.throw(MultiDictKeyError);
    // Missing date
    multidict = new MultiDict();
    multidict.add('foo_time', '13:00');
    multidict.add('foo_timezone', 'US-America/Chicago');
    expect(function () { multidict.fetchMomentTimezone('foo'); }).to.throw(MultiDictKeyError);
    // Missing time
    multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_timezone', 'US-America/Chicago');
    expect(function () { multidict.fetchMomentTimezone('foo'); }).to.throw(MultiDictKeyError);
    // Missing timezone
    multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '13:00');
    expect(function () { multidict.fetchMomentTimezone('foo'); }).to.throw(MultiDictKeyError);
  });

  // Normalization logic
  // https://www.w3.org/TR/2012/WD-html-markup-20120329/input.date.html#input.date.attrs.value
  it('accepts YYYY-MM-DD (HTML5 standard) date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '00:00');
    multidict.add('foo_timezone', 'GB-Europe/London');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });
  // DEV: We don't have to support these but it's quite simple with `moment`
  it('accepts YYYY/MM/DD (Europe) date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017/01/31');
    multidict.add('foo_time', '00:00');
    multidict.add('foo_timezone', 'GB-Europe/London');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });
  it('accepts MM-DD-YYYY (USA) date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '01-31-2017');
    multidict.add('foo_time', '00:00');
    multidict.add('foo_timezone', 'GB-Europe/London');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T00:00:00.000Z');
  });

  // https://www.w3.org/TR/2012/WD-html-markup-20120329/input.time.html#input.time.attrs.value
  // https://tools.ietf.org/html/rfc3339#section-5.6
  it('accepts HH:MM:SS (HTML5 standard) time strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '12:34:56');
    multidict.add('foo_timezone', 'GB-Europe/London');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T12:34:56.000Z');
  });
  it('accepts HH:MM:SS.ss (HTML5 standard) time strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '12:34:56.123');
    multidict.add('foo_timezone', 'GB-Europe/London');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T12:34:56.123Z');
  });
  it('accepts h:mmA (datepicker) time strings', function () {
    // AM test
    var multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '7:12AM');
    multidict.add('foo_timezone', 'GB-Europe/London');
    var momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T07:12:00.000Z');

    // PM test
    multidict = new MultiDict();
    multidict.add('foo_date', '2017-01-31');
    multidict.add('foo_time', '11:12PM');
    multidict.add('foo_timezone', 'GB-Europe/London');
    momentInstance = multidict.getMomentTimezone('foo');
    expect(momentInstance.toISOString()).to.equal('2017-01-31T23:12:00.000Z');
  });

  // Edge case handling of invalid data
  it('doesn\'t support empty date strings', function () {
    var multidict = new MultiDict();
    multidict.add('foo_date', '');
    multidict.add('foo_time', '00:00');
    multidict.add('foo_timezone', 'GB-Europe/London');
    expect(multidict.getMomentTimezone('foo')).to.equal(undefined);
    expect(multidict.getMomentTimezone('foo', 'fallback')).to.equal('fallback');
    expect(function () { multidict.fetchMomentTimezone('foo'); }).to.throw(HttpError.BadRequest);
  });
});
