// Load in our dependencies
var sinon = require('sinon');

// Define our exports
// http://sinonjs.org/docs/#spies-api
exports.spy = function (obj, method) {
  // DEV: We only support object/method notation as we can't restore anything else
  before(function setupSpy () {
    // DEV: To access the spy, reference the swapped method (i.e. `obj[method]`)
    sinon.spy(obj, method);
  });
  after(function cleanup () {
    obj[method].restore();
  });
};

// http://sinonjs.org/docs/#stubs-api
exports.stub = function (obj, method/*, func*/) {
  var args = [].slice.call(arguments);
  before(function setupStub () {
    sinon.stub.apply(sinon, args);
  });
  after(function cleanup () {
    obj[method].restore();
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
