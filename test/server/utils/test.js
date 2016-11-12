// Load in our dependencies
var _ = require('underscore');
var fakeGoogleFactory = require('./fake-google');
var server = require('../../../server/index.js');
var sequelize = server.app.sequelize;

// DEV: This file is loaded directly by `mocha` first
//   so we get fancy global behavior
//   We avoid requires from other files to prevent circular dependencies

// Define all-in-one describe handler
var serverIsListening = false;
function _scenario(key, describeStr, options, describeFn) {
  // If there is no describe function, then assume it was options
  // `scenario('A request ...', function () {})` -> `scenario('A request ...', {}, function () {})`
  if (describeFn === undefined) {
    describeFn = options;
    options = {};
  }

  // Set up default options
  options = _.extend({
    dbFixtures: [/* Use factoryFixtures.DEFAULT_FIXTURES */],
    // DEV: Later services might want to add/remove a single fixture
    //   We could support that via `{add: [], remove: [], removeAll: true}`
    //   Default behavior would be `[overrides] = {add: [overrides], removeAll: true}`
    googleFixtures: fakeGoogleFactory.DEFAULT_FIXTURES
  }, options);

  // Call describe function (e.g. `describe`, `describe.skip`)
  //   on context of describe object
  function scenarionFn() {
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

    // If we want to set up database fixtures, then clean our database and add fixtures
    if (options.dbFixtures) {
      before(function truncateDatabase (done) {
        // http://docs.sequelizejs.com/en/v3/docs/raw-queries/
        // https://www.postgresql.org/docs/9.3/static/sql-truncate.html
        // DEV: PostgreSQL doesn't support truncating all tables via a `*`
        // DEV: Our query is vulnerable to SQL injection but we can't use bind and trust our table names more/less
        // var tableNames = _.pluck(_.values(sequelize.models), 'tableName');
        var tableNames = ['audit_logs', 'candidates'];
        sequelize.query('TRUNCATE TABLE ' + tableNames.join(', ')).asCallback(done);
      });
      // TODO: Add fixtures setup
    }

    // If we have Google fixtures, then run a server
    if (options.googleFixtures && options.googleFixtures.length) {
      fakeGoogleFactory.run(options.googleFixtures);
    }

    // Run describe actions
    describeFn.call(this);
  }

  // Call Mocha's describe function (e.g. `describe`, `describe.only`)
  if (key) {
    describe[key](describeStr, scenarionFn);
  } else {
    describe(describeStr, scenarionFn);
  }
}
exports.scenario = function (describeStr, options, describeFn) {
  _scenario(null, describeStr, options, describeFn);
};
exports.scenario.only = function (describeStr, options, describeFn) {
  _scenario('only', describeStr, options, describeFn);
};
exports.scenario.skip = function (describeStr, options, describeFn) {
  _scenario('skip', describeStr, options, describeFn);
};

// Export `scenario` globally for simplicity
global.scenario = exports.scenario;
