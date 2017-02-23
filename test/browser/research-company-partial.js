// Load in our dependencies
var assert = require('assert');
var fs = require('fs');
var qs = require('querystring');
var _ = require('underscore');
var sinon = require('sinon');
var sinonUtils = require('../utils/sinon');
var expect = require('chai').expect;
var domUtils = require('./utils/dom');
var $simulant = require('./utils/$simulant');
var browserInit = require('./utils/browser').init;

// Load in our contracts
var partialFullReqContract = fs.readFileSync(
  __dirname + '/../test-files/http-contracts/research-company-partial-save-200-req.raw', 'utf8');
var partialFullResContract = fs.readFileSync(
  __dirname + '/../test-files/http-contracts/research-company-partial-save-200-res.html', 'utf8');

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

// Define HTTP fixtures
var RESEARCH_COMPANY_PARTIAL_200_FIXTURE = {
  method: 'POST',
  url: '/research-company',
  fn: function (req) {
    // Verify we meet our contract
    // http://sinonjs.org/docs/#FakeXMLHttpRequest
    var actualReqQs = qs.parse(req.requestBody);
    var expectedReqQs = qs.parse(partialFullReqContract);
    expect(actualReqQs).to.have.same.keys(expectedReqQs);

    // Reply with other contract half
    // http://sinonjs.org/docs/#respond
    req.respond(200, {}, partialFullResContract);
  }
};
var RESEARCH_COMPANY_PARTIAL_200_FIXTURE_INCREMENTING = {
  method: 'POST',
  url: '/research-company',
  fn: function (req) {
    req.respond(200, {},
      partialFullResContract.replace('IBM', 'IBM' + this.requests.length));
  }
};
var RESEARCH_COMPANY_PARTIAL_500_FIXTURE = {
  method: 'POST',
  url: '/research-company',
  fn: function (req) {
    req.respond(500, {}, '<p>Content irrelevant</p>');
  }
};

// Start our tests
describe('A partial research company form loading with a company name', function () {
  testUtils.init({
    values: {company_name: 'Mock company'}
  });
  sinonUtils.stubUndefined(window, 'ga');
  sinonUtils.mockXHR([RESEARCH_COMPANY_PARTIAL_200_FIXTURE]);
  before(function handleInit () {
    // Bind our sync and call our server reply
    browserInit(this.el);
    this.sinonServer.respond();
  });

  it('renders content onload', function () {
    // Verify we called our fixture
    // DEV: We use `length` in `expect` to prevent serialization issues
    expect(this.requests.length).to.equal(1);
    expect(this.requests[0].url).to.equal('/research-company');
    expect(this.requests[0].requestHeaders).to.have.property('X-Partial', '1');
    expect(this.requests[0].requestBody).to.equal('x-csrf-token=mock-csrf-token&company_name=Mock%20company');

    // Verify content
    var $partialFormErrors = this.$('#partial-form-errors'); assert($partialFormErrors.length);
    expect($partialFormErrors.get(0).className).to.contain('hidden');
    var $glassdoorResults = this.$('#glassdoor-results'); assert($glassdoorResults.length);
    expect($glassdoorResults.text()).to.contain('Name: IBM');
    var $angellistResults = this.$('#angellist-results'); assert($angellistResults.length);
    expect($angellistResults.text()).to.contain('AngelList support is under construction');
  });

  it('doesn\'t record analytics event', function () {
    var gaSpy = window.ga;
    expect(gaSpy.callCount).to.equal(0);
  });
});

describe('A partial research company form loading without a company name', function () {
  testUtils.init({
    values: {company_name: ''}
  });
  sinonUtils.mockXHR([RESEARCH_COMPANY_PARTIAL_200_FIXTURE]);
  before(function handleInit () {
    // Bind our sync and call our server reply
    browserInit(this.el);
    this.sinonServer.respond();
  });

  it('doesn\'t load content', function () {
    // Verify no requests
    // DEV: We use `length` in `expect` to prevent serialization issues
    expect(this.requests.length).to.equal(0);

    // Verify content
    var $partialFormErrors = this.$('#partial-form-errors'); assert($partialFormErrors.length);
    expect($partialFormErrors.get(0).className).to.contain('hidden');
    var $glassdoorResults = this.$('#glassdoor-results'); assert($glassdoorResults.length);
    expect($glassdoorResults.text()).to.contain('No company name entered');
    var $angellistResults = this.$('#angellist-results'); assert($angellistResults.length);
    expect($angellistResults.text()).to.contain('AngelList support is under construction');
  });
});

describe('A partial research company form performing a successful search', function () {
  testUtils.init({
    values: {company_name: ''}
  });
  sinonUtils.stubUndefined(window, 'ga');
  sinonUtils.mockXHR([RESEARCH_COMPANY_PARTIAL_200_FIXTURE]);
  before(function handleInit () {
    // Bind our sync and call our server reply
    browserInit(this.el);
    this.sinonServer.respond();
  });

  it('replaces content with server response', function (done) {
    // Verify no requests
    // DEV: We use `length` in `expect` to prevent serialization issues
    expect(this.requests.length).to.equal(0);

    // Update our field and perform the search
    var $companyName = this.$('input[name=company_name]');
    $companyName.val('Mock company');
    var $searchLink = this.$('a[href="/research-company"]');
    $simulant.fire($searchLink, 'click');

    // Verify loading state disables fields
    expect(this.$('.research-company').get(0).className).to.contain('muted');
    expect($companyName.attr('disabled')).to.equal('disabled');
    expect($searchLink.attr('disabled')).to.equal('disabled');

    // Complete search and wait for Sinon to raise assertions if any
    this.sinonServer.respond();
    var that = this;
    process.nextTick(function handleNextTick () {
      // Verify fields re-enabled
      expect(that.$('.research-company').get(0).className).to.not.contain('muted');
      expect($companyName.attr('disabled')).to.equal(undefined);
      expect($searchLink.attr('disabled')).to.equal(undefined);

      // Verify content
      var $partialFormErrors = that.$('#partial-form-errors'); assert($partialFormErrors.length);
      expect($partialFormErrors.get(0).className).to.contain('hidden');
      var $glassdoorResults = that.$('#glassdoor-results'); assert($glassdoorResults.length);
      expect($glassdoorResults.text()).to.contain('Name: IBM');
      var $angellistResults = that.$('#angellist-results'); assert($angellistResults.length);
      expect($angellistResults.text()).to.contain('AngelList support is under construction');
      done();
    });
  });

  it('records an analytics event', function () {
    var gaSpy = window.ga;
    expect(gaSpy.callCount).to.equal(1);
    expect(gaSpy.args[0]).to.deep.equal(['send', 'event', 'Research company', 'partial-search', 'Mock company']);
  });
});

describe('A partial research company form performing an erroring search', function () {
  testUtils.init({
    values: {company_name: 'Mock company'}
  });
  sinonUtils.mockXHR([RESEARCH_COMPANY_PARTIAL_500_FIXTURE]);
  before(function handleInit () {
    // Bind our sync and call our server reply
    // DEV: We silence onerror temporarily for our response
    browserInit(this.el);
    var onerrorStub = sinon.stub(window, 'onerror');
    this.sinonServer.respond();
    onerrorStub.restore();
  });

  it('notifies user about error', function () {
    // Verify we called our fixture
    // DEV: We use `length` in `expect` to prevent serialization issues
    expect(this.requests.length).to.equal(1);

    // Verify fields re-enabled
    expect(this.$('.research-company').get(0).className).to.not.contain('muted');
    expect(this.$('input[name=company_name]').attr('disabled')).to.equal(undefined);
    expect(this.$('a[href="/research-company"]').attr('disabled')).to.equal(undefined);

    // Verify content
    var $partialFormErrors = this.$('#partial-form-errors'); assert($partialFormErrors.length);
    expect($partialFormErrors.get(0).className).to.not.contain('hidden');
    expect($partialFormErrors.text()).to.contain('Failed to retrieve results');
  });
});

// Edge case testing
describe('A partial research company form performing multiple searches', function () {
  testUtils.init({
    values: {company_name: ''}
  });
  sinonUtils.mockXHR([RESEARCH_COMPANY_PARTIAL_200_FIXTURE_INCREMENTING]);

  it('replaces content with server response', function (done) {
    // Bind our sync and call our server reply
    browserInit(this.el);

    // Update our field and perform a search
    this.$('input[name=company_name]').val('Mock company');
    $simulant.fire(this.$('a[href="/research-company"]'), 'click');
    this.sinonServer.respond();
    expect(this.requests.length).to.equal(1);

    // Search again
    $simulant.fire(this.$('a[href="/research-company"]'), 'click');
    this.sinonServer.respond();
    expect(this.requests.length).to.equal(2);

    // Wait for Sinon to raise assertions if any
    var that = this;
    process.nextTick(function handleNextTick () {
      // Verify content
      var $glassdoorResults = that.$('#glassdoor-results'); assert($glassdoorResults.length);
      expect($glassdoorResults.text()).to.contain('Name: IBM2');
      var $angellistResults = that.$('#angellist-results'); assert($angellistResults.length);
      expect($angellistResults.text()).to.contain('AngelList support is under construction');
      done();
    });
  });
});
