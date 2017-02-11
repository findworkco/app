// Load in our dependencies
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
