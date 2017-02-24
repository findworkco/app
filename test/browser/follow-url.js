// Load in our dependencies
var fs = require('fs');
var expect = require('chai').expect;
var domUtils = require('./utils/dom');
var $simulant = require('./utils/$simulant');
var browserInit = require('./utils/browser').init;

// Define common helper
var applicationMixinsJade = fs.readFileSync(__dirname + '/../../server/views/application-mixins.jade', 'utf8');
var testUtils = {
  init: function () {
    // DEV: These are automatically wrapped in a `div` for ease of use
    domUtils.init([applicationMixinsJade], function () {/*
      +posting-url({posting_url: 'http://test.findwork.co/'})
    */}, {
      form_data: {get: function () {}}
    });
  }
};

// Start our tests
describe('A follow-url set of elements being rendered', function () {
  testUtils.init();

  it('initializes with follow-url as target URL', function () {
    // DEV: This is done via Jade, not via our plugin
    expect(this.$('a[data-follow-url]').attr('href')).to.equal('http://test.findwork.co/');
  });
});

describe('A follow-url set of elements being updated', function () {
  testUtils.init();

  it('updates follow-url as input changes', function () {
    // Initialize our JS
    browserInit(this.el);
    var $link = this.$('a[data-follow-url]');
    var $input = this.$('input[name=posting_url]');

    // Trigger a change and assert result
    $input.val('http://google.com/');
    $simulant.fire($input, 'input');
    expect($link.attr('href')).to.equal('http://google.com/');
  });
});
