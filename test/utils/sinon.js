// Load in our dependencies
// DEV: Please avoid any non-sinon dependencies as this is shared by browser/server
var assert = require('assert');
var sinon = require('sinon');

// Define our exports
// http://sinonjs.org/docs/#spies-api
exports.spy = function (obj, method) {
  // DEV: We only support object/method notation as we can't restore anything else
  var spy;
  before(function setupSpy () {
    // DEV: To access the spy, reference the swapped method (i.e. `obj[method]`)
    spy = sinon.spy(obj, method);
  });
  after(function cleanup () {
    spy.restore();
  });
};

// http://sinonjs.org/docs/#stubs-api
exports.stub = function (obj, method/*, func*/) {
  var args = [].slice.call(arguments);
  var stub;
  before(function setupStub () {
    stub = sinon.stub.apply(sinon, args);
  });
  after(function cleanup () {
    stub.restore();
  });
};
exports.stubUndefined = function (obj, method/*, func*/) {
  // Swap noop function into key so Sinon will swap
  // DEV: We perform `after` after calling stub so we delete afterwards
  before(function swapBefore () {
    assert.strictEqual(obj[method], undefined);
    obj[method] = function () {};
  });
  exports.stub.apply(this, arguments);
  after(function cleanupSwap () {
    delete obj[method];
  });
};

// Bespoke non-Sinon method but whatevs
exports.swap = function (obj, key, val) {
  var origVal;
  before(function setupStub () {
    origVal = obj[key];
    obj[key] = val;
  });
  after(function cleanup () {
    obj[key] = origVal;
  });
};

// XHR mocking
exports.mockXHR = function (responses) {
  before(function callMockXHR () {
    // Create our server
    // http://sinonjs.org/docs/#fakeServer
    // DEV: `this.sinonServer.respond()` must be called to trigger responses
    //   This allows us to test loading states
    assert(!this.sinonServer, 'Expected no Sinon server to be running but one is. ' +
      'Please only use `testUtils.mockXHR` once per test');
    this.sinonServer = sinon.fakeServer.create();

    // Bind our responses
    this.requests = [];
    var that = this;
    responses.forEach(function bindResponse (response) {
      that.sinonServer.respondWith(response.method, response.url, function handleRequest (req) {
        // Save our request
        that.requests.push(req);

        // Call our fixture
        return response.fn.apply(that, arguments);
      });
    });
  });
  after(function cleanup () {
    this.sinonServer.restore();
    delete this.sinonServer;
  });
};
