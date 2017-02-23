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
        data-datetimepicker-hide="#target")
      +datetimepicker("target", targetMoment)#target
    */}, _.extend({
      moment: moment,
      tzStable: tzStable
    }, locals));
  }
};

// Start our tests
describe('A set of hide-bound datetimepickers (date)', function () {
  testUtils.init({
    sourceMoment: moment.tz('2022-02-03T04:05:06', 'US-America/Chicago'),
    targetMoment: moment.tz('2022-02-03T06:05:06', 'US-America/Chicago')
  });

  it('updating date hides/shows target datetimepicker', function () {
    // Bind our sync
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);

    // Sanity check conditions
    expect($source.find('input[type=date]').val()).to.equal('2022-02-03');
    expect($target.find('input[type=date]').val()).to.equal('2022-02-03');
    expect($target.get(0).className).to.not.contain('hidden');

    // Update date and assert hide
    var $sourceDate = $source.find('input[type=date]');
    $sourceDate.val('2016-02-03');
    $simulant.fire($sourceDate, 'change');
    expect($target.get(0).className).to.contain('hidden');

    // Update date and assert show
    $sourceDate.val('2022-02-03');
    $simulant.fire($sourceDate, 'change');
    expect($target.get(0).className).to.not.contain('hidden');
  });
});

describe('A set of hide-bound datetimepickers (time)', function () {
  // DEV: We use GB-Europe/London so timezone is neutral
  testUtils.init({
    sourceMoment: moment.tz('GB-Europe/London').add({minutes: 1}),
    targetMoment: moment.tz('GB-Europe/London').add({minutes: 9})
  });

  it('updating date hides/shows target datetimepicker', function () {
    // Bind our sync
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);

    // Sanity check conditions
    expect($target.get(0).className).to.not.contain('hidden');

    // Update time and assert hide
    // DEV: This test can fail for 2 minutes at midnight CST (11:59PM - 12:01AM)
    var $sourceTime = $source.find('input[type=time]');
    $sourceTime.val('12:01AM');
    $simulant.fire($sourceTime, 'change');
    expect($target.get(0).className).to.contain('hidden');

    // Update time and assert show
    $sourceTime.val('11:59PM');
    $simulant.fire($sourceTime, 'change');
    expect($target.get(0).className).to.not.contain('hidden');
  });
});

describe('A set of hide-bound datetimepickers (timezone)', function () {
  testUtils.init({
    sourceMoment: moment.tz('GB-Europe/London').add({hours: 1}),
    targetMoment: moment.tz('GB-Europe/London').add({hours: 3})
  });

  it('updating date hides/shows target datetimepicker', function () {
    // Bind our sync
    browserInit(this.el);
    var $source = this.$('#source'); assert($source.length);
    var $target = this.$('#target'); assert($target.length);

    // Sanity check conditions
    expect($target.get(0).className).to.not.contain('hidden');

    // Update time and assert hide
    // DEV: We use Tokyo as it's ahead of UTC, not behind it
    var $sourceTimezone = $source.find('select[data-chosen]');
    $sourceTimezone.val('JP-Asia/Tokyo');
    $simulant.fire($sourceTimezone, 'change');
    expect($target.get(0).className).to.contain('hidden');

    // Update time and assert show
    $sourceTimezone.val('GB-Europe/London');
    $simulant.fire($sourceTimezone, 'change');
    expect($target.get(0).className).to.not.contain('hidden');
  });
});
