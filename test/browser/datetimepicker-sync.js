// Load in our dependencies
var assert = require('assert');
var fs = require('fs');
var _ = require('underscore');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var domUtils = require('./utils/dom');
var $simulant = require('./utils/$simulant');
var browserInit = require('./utils/browser').init;
var tzStable = require('../../server/utils/tz-stable.js');

// Define common helper
var mixinsJade = fs.readFileSync(__dirname + '/../../server/views/mixins.jade', 'utf8');
var testUtils = {
  init: function (locals) {
    // DEV: These are automatically wrapped in a `div` for ease of use
    domUtils.init([mixinsJade], function () {/*
      +datetimepicker("source", sourceMoment)#source(
        data-datetimepicker-sync="#target")
      +datetimepicker("target", targetMoment)#target
    */}, _.extend({
      moment: moment,
      // Filter to US only for simplicity
      tzStable: _.where(tzStable, {countryCode: 'US'})
    }, locals));
  }
};

// Start our tests
describe('A pair of synced datetimepickers updating the source info', function () {
  testUtils.init({
    sourceMoment: moment.tz('2016-02-03T04:05:06', 'US-America/Chicago'),
    targetMoment: moment.tz('2016-02-03T06:05:06', 'US-America/Chicago')
  });

  it('updates target date, time, and timezone', function () {
    // Bind our sync
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);

    // Sanity check conditions, update date, and assert isolated changes
    expect($source.find('input[type=date]').val()).to.equal('2016-02-03');
    expect($target.find('input[type=date]').val()).to.equal('2016-02-03');
    var $sourceDate = $source.find('input[type=date]');
    $sourceDate.val('2016-04-01');
    $simulant.fire($sourceDate, 'change');
    expect($target.find('input[type=date]').val()).to.equal('2016-04-01');

    // Update time and assert isolated changes
    expect($source.find('input[type=time]').val()).to.equal('4:05AM');
    expect($target.find('input[type=time]').val()).to.equal('6:05AM');
    var $sourceTime = $source.find('input[type=time]');
    $sourceTime.val('9:20PM');
    $simulant.fire($sourceTime, 'change');
    expect($target.find('input[type=time]').val()).to.equal('11:20PM');

    // Update timezone and assert isolated changes
    expect($source.find('select').val()).to.equal('US-America/Chicago');
    expect($target.find('select').val()).to.equal('US-America/Chicago');
    var $sourceTimezone = $source.find('select');
    $sourceTimezone.val('US-America/New_York');
    $simulant.fire($sourceTimezone, 'change');
    expect($target.find('select').val()).to.equal('US-America/New_York');
  });
});

describe('A pair of synced datetimepickers updating the target info', function () {
  testUtils.init({
    sourceMoment: moment.tz('2016-02-03T04:05:06', 'US-America/Chicago'),
    targetMoment: moment.tz('2016-02-03T06:05:06', 'US-America/Chicago')
  });

  it('doesn\'t update the source date, time, and timezone', function () {
    // Bind our sync
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);

    // Sanity check conditions, update date, and assert no changes
    expect($source.find('input[type=date]').val()).to.equal('2016-02-03');
    expect($target.find('input[type=date]').val()).to.equal('2016-02-03');
    var $targetDate = $target.find('input[type=date]');
    $targetDate.val('2016-04-01');
    $simulant.fire($targetDate, 'change');
    expect($source.find('input[type=date]').val()).to.equal('2016-02-03');

    // Update time and assert no changes
    expect($source.find('input[type=time]').val()).to.equal('4:05AM');
    expect($target.find('input[type=time]').val()).to.equal('6:05AM');
    var $targetTime = $target.find('input[type=time]');
    $targetTime.val('9:20PM');
    $simulant.fire($targetTime, 'change');
    expect($source.find('input[type=time]').val()).to.equal('4:05AM');

    // Update timezone and assert no changes
    expect($source.find('select').val()).to.equal('US-America/Chicago');
    expect($target.find('select').val()).to.equal('US-America/Chicago');
    var $targetTimezone = $target.find('select');
    $targetTimezone.val('US-America/New_York');
    $simulant.fire($targetTimezone, 'change');
    expect($source.find('select').val()).to.equal('US-America/Chicago');
  });
});

describe('A pair of timezone unsynced datepickers updating the source info', function () {
  testUtils.init({
    sourceMoment: moment.tz('2016-02-03T04:05:06', 'US-America/Chicago'),
    targetMoment: moment.tz('2016-02-03T06:05:06', 'US-America/Los_Angeles')
  });

  it('updates doesn\'t update the timezone', function () {
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);

    expect($source.find('select').val()).to.equal('US-America/Chicago');
    expect($target.find('select').val()).to.equal('US-America/Los_Angeles');
    var $sourceTimezone = $source.find('select');
    $sourceTimezone.val('US-America/New_York');
    $simulant.fire($sourceTimezone, 'change');
    expect($target.find('select').val()).to.equal('US-America/Los_Angeles');
  });
});

// Edge case: Dec 31 23:00 + 2 hours -> Jan 1 01:00
describe('A pair of synced datetimepickers on a date-edge updating the source info', function () {
  testUtils.init({
    sourceMoment: moment.tz('2016-12-31T04:05:06', 'US-America/Chicago'),
    targetMoment: moment.tz('2016-12-31T23:30:00', 'US-America/Chicago')
  });

  it('updates target date and time over its edge', function () {
    // Bind our sync and assert initial conditions
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);
    expect($source.find('input[type=date]').val()).to.equal('2016-12-31');
    expect($source.find('input[type=time]').val()).to.equal('4:05AM');
    expect($target.find('input[type=date]').val()).to.equal('2016-12-31');
    expect($target.find('input[type=time]').val()).to.equal('11:30PM');

    // Perform our update and assert result
    var $sourceTime = $source.find('input[type=time]');
    $sourceTime.val('6:05AM');
    $simulant.fire($sourceTime, 'change');
    expect($target.find('input[type=date]').val()).to.equal('2017-01-01');
    expect($target.find('input[type=time]').val()).to.equal('1:30AM');
  });
});
