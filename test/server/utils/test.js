// Load in our dependencies
var server = require('../../../server/index.js');

// Define all-in-one describe handler
var serverIsListening = false;
exports.scenario = function (describeStr, options, describeFn) {
  // If there is no describe function, then assume it was options
  // `scenario('A request ...', function () {})` -> `scenario('A request ...', {}, function () {})`
  if (describeFn === undefined) {
    describeFn = options;
    options = {};
  }

  // TODO: Extend user options

  // TODO: Add Google fixtures

  // Call normal describe
  describe(describeStr, function scenarionFn () {
    // Start our server
    before(function runServer () {
      // If the server isn't yet running, then start it
      // DEV: We don't listen on `require` as it might cause undesired behavior
      //   I have no idea what though...
      if (!serverIsListening) {
        server.listen();
        serverIsListening = true;
      }
    });

    // Run describe actions
    describeFn.call(this);
  });
};
exports.scenario.skip = describe.skip;

// Export `scenario` globally for simplicity
global.scenario = exports.scenario;
