// Load in our dependencies
var fs = require('fs');
var _ = require('underscore');
var expect = require('chai').expect;
var domUtils = require('./utils/dom');
var browserInit = require('./utils/browser').init;

// Define common helper
var mixinsJade = fs.readFileSync(__dirname + '/../../server/views/mixins.jade', 'utf8');
var applicationMixinsJade = fs.readFileSync(__dirname + '/../../server/views/application-mixins.jade', 'utf8');
var testUtils = {
  init: function (locals) {
    // DEV: These are automatically wrapped in a `div` for ease of use
    domUtils.init([mixinsJade, applicationMixinsJade], function () {/*
      +company-notes-and-research(values)
    */}, _.extend({
      csrfToken: 'mock-csrf-token',
      form_data: {get: function () {}}
    }, locals));
  }
};

// Start our tests
describe('A collapse section being collapsed/expanded', function () {
  testUtils.init({
    values: {company_name: ''}
  });

  it('renders content onload', function () {
    // Verify initial content setup
    var $collapseToggle = this.$('[data-toggle="collapse"]');
    expect($collapseToggle.text()).to.equal('expand section');

    // Bind our toggler
    browserInit(this.el);

    // Perform an expand and verify content
    $collapseToggle.click();
    expect($collapseToggle.text()).to.equal('collapse section');

    // Perform a collapse and verify content
    $collapseToggle.click();
    expect($collapseToggle.text()).to.equal('expand section');
  });
});
