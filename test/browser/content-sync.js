// Load in our dependencies
var expect = require('chai').expect;
var domUtils = require('./utils/dom');
var $simulant = require('./utils/$simulant');
var contentSync = require('../../browser/js/content-sync');

// Define common helper
var testUtils = {
  init: function () {
    // DEV: These are automatically wrapped in a `div` for ease of use
    domUtils.init(function () {/*
      input(data-content-sync="#target", value="foo")
      p#target
    */});
  }
};

// Start our tests
describe('An pair of content-synced elements with content', function () {
  testUtils.init();

  it('initializes with target element\'s content', function () {
    // Initialize our content and assert
    contentSync.init(this.el);
    expect(this.$('#target').text()).to.equal('foo');
  });
});

describe('An input event on content-synced elements with content', function () {
  testUtils.init();

  it('updates target element\'s content', function () {
    // Simulate an input event and assert
    contentSync.init(this.el);
    this.$('input').val('bar');
    $simulant.fire(this.$('input'), 'input');
    expect(this.$('#target').text()).to.equal('bar');
  });
});

describe('An input event on content-synced elements with no content', function () {
  testUtils.init();

  it('falls back target element\'s content to a non-breaking space', function () {
    // Simulate an input event and assert
    contentSync.init(this.el);
    this.$('input').val('');
    $simulant.fire(this.$('input'), 'input');
    expect(this.$('#target').html()).to.equal('&nbsp;');
  });
});
