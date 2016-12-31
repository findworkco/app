// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var async = require('async');
var sequelizeFixtures = require('sequelize-fixtures');
var dbFixtures = require('./db-fixtures');
var fakeGoogleFactory = require('./fake-google');
var server = require('../../../server/index.js');
var sequelize = server.app.sequelize;

// DEV: This file is loaded directly by `mocha` first
//   so we get fancy global behavior
//   We avoid requires from other files to prevent circular dependencies

// Define our constants
var SCENARIO_ROUTE = 'route';
var SCENARIO_ROUTE_TEST = 'routeTest';
var SCENARIO_LOGGED_OUT = 'loggedOut';
var SCENARIO_NON_EXISTENT = 'nonExistent';
var SCENARIO_NON_OWNER = 'nonOwner';

// Define a general `describe` wrapper
function normalizeArguments(describeStr, options, describeFn) {
  // If there is no describe function, then assume it was options
  // `scenario('A request ...', function () {})` -> `scenario('A request ...', {}, function () {})`
  if (describeFn === undefined) {
    describeFn = options;
    options = {};
  }

  // Return our normalized options
  return [describeStr, options, describeFn];
}
function getDescribeWrapper(defaultOptions, wrapper) {
  // Define our describe wrapper
  function callDescribe(describeStr, options, describeFn) {
    var args = normalizeArguments.apply(this, arguments);
    args[1] /* options */ = _.defaults({}, args[1] /* options */, defaultOptions);
    describe(describeStr, wrapper.apply(this, args));
  }
  callDescribe.skip = function (describeStr, options, describeFn) {
    var args = normalizeArguments.apply(this, arguments);
    args[1] /* options */ = _.defaults({}, args[1] /* options */, defaultOptions);
    describe.skip(describeStr, wrapper.apply(this, args));
  };
  callDescribe.only = function (describeStr, options, describeFn) {
    var args = normalizeArguments.apply(this, arguments);
    args[1] /* options */ = _.defaults({}, args[1] /* options */, defaultOptions);
    describe.only(describeStr, wrapper.apply(this, args));
  };

  // Return our wrapped describe funciton
  return callDescribe;
}

// Define all-in-one describe handler
var serverIsListening = false;
function _scenarioBaseSetup(describeStr, options, describeFn) {
  // If we want to start our server, then start it
  // DEV: We don't need to start our server in model only tests
  if (options.startServer) {
    before(function runServer () {
      // If the server isn't yet running, then start it
      // DEV: We don't listen on `require` as it might cause undesired behavior
      //   I have no idea what though...
      if (!serverIsListening) {
        server.listen();
        serverIsListening = true;
      }
    });
  }

  // If we want to set up database fixtures, then clean our database and add fixtures
  if (options.dbFixtures) {
    before(function truncateDatabase (done) {
      // http://docs.sequelizejs.com/en/v3/docs/raw-queries/
      // DEV: We use DELETE over TRUNCATE as it's faster (speed up from 20s to 14s)
      // DEV: Our query is vulnerable to SQL injection but we can't use bind and trust our table names more/less
      var tableNames = _.pluck(_.values(sequelize.models), 'tableName');
      async.each(tableNames, function handleEach (tableName, cb) {
        sequelize.query('DELETE FROM ' + tableName).asCallback(cb);
      }, done);
    });
    before(function installFixtures (done) {
      // Resolve our fixtures
      var selectedFixtureKeys = _.flatten(options.dbFixtures);
      var selectedFixturesObj = _.pick(dbFixtures, selectedFixtureKeys);
      var missingFixtures = _.difference(selectedFixtureKeys, Object.keys(selectedFixturesObj));
      if (missingFixtures.length !== 0) {
        throw new Error('We were unable to find database fixtures: ' + missingFixtures.join(', ') + '. ' +
          'Please verify `options.dbFixtures` is correct');
      }

      // Resolve our fixtures, add in their source, and load into the db
      var selectedFixtures = _.values(selectedFixturesObj);
      selectedFixtures = selectedFixtures.map(function addBuildOptions (fixture) {
        return _.defaults({
          saveOptions: _.defaults({_sourceType: 'server'}, fixture.saveOptions)
        }, fixture);
      });
      sequelizeFixtures.loadFixtures(selectedFixtures, sequelize.models).asCallback(done);
    });
  }

  // If we want to flush Redis, then flush it
  if (options.flushRedis) {
    before(function flushRedisFn (done) {
      server.app.redisClient.flushdb(done);
    });
  }

  // If we have Google fixtures, then run a server
  if (options.googleFixtures && options.googleFixtures.length) {
    fakeGoogleFactory.run(options.googleFixtures);
  }
}
function _scenarioRouteTestBaseSetup(describeStr, options, describeFn) {
  // Verify we are in a route scenario
  assert.strictEqual(this.parent._scenario, SCENARIO_ROUTE,
    'Route test expected to be in a `scenario.route` but it wasn\'t');

  // Run our normal setup
  _scenarioBaseSetup.call(this, describeStr, options, describeFn);
}
// Set up common options
var DEFAULT_ROUTE_TEST_OPTIONS = {
  dbFixtures: dbFixtures.DEFAULT_FIXTURES,
  flushRedis: true,
  // DEV: Later services might want to add/remove a single fixture
  //   We could support that via `{add: [], remove: [], removeAll: true}`
  //   Default behavior would be `[overrides] = {add: [overrides], removeAll: true}`
  googleFixtures: fakeGoogleFactory.DEFAULT_FIXTURES,
  startServer: true
};
exports.scenario = getDescribeWrapper(DEFAULT_ROUTE_TEST_OPTIONS,
    function _scenarioWrapper (describeStr, options, describeFn) {
  // Define our scenario function
  return function scenarioFn () {
    // Run our base setup
    _scenarioBaseSetup.call(this, describeStr, options, describeFn);

    // Run describe actions
    describeFn.call(this);
  };
});

// Define route + ACL wrappers
// DEV: In future iterations, we may allow `route` to host parent options to route tests
// scenario.route('A request to GET /item/:id',  {
//   dbFixtures: [dbFixtures.ITEM, dbFixtures.DEFAULT_FIXTURES],
//   url: serverUtils.getUrl('/item/' + itemId)
// }, function () {
//   this.scenarioUrl = urlDefinedAbove
exports.scenario.route = getDescribeWrapper({} /* Doesn't use base setup */,
    function _scenarioRouteWrapper (describeStr, options, describeFn) {
  return function scenarioRouteFn () {
    // Flag our suite with a scenario property
    this._scenario = SCENARIO_ROUTE;

    // Run describe actions
    describeFn.call(this);

    // Fallback our options
    options = _.defaults({
      requiredTests: _.extend({
        loggedOut: true,
        nonExistent: true,
        nonOwner: true
      }, options.requiredTests)
    }, options);

    // Verify we had our ACL methods run
    // jscs:disable safeContextKeyword
    var suite = this;
    // jscs:enable safeContextKeyword
    var childSuites = suite.suites;
    if (options.requiredTests.loggedOut === true) {
      assert(_.findWhere(childSuites, {_scenario: SCENARIO_LOGGED_OUT}),
        '`scenario.route(\'' + suite.fullTitle() + '\')` expected to have a loggedOut `scenario` but it didn\'t. ' +
        'Please add a `scenario.loggedOut` or disable it via `requiredTests: {loggedOut: false}`');
    }
    if (options.requiredTests.nonExistent === true) {
      assert(_.findWhere(childSuites, {_scenario: SCENARIO_NON_EXISTENT}),
        '`scenario.route(\'' + suite.fullTitle() + '\')` expected to have a nonExistent `scenario` but it didn\'t. ' +
        'Please add a `scenario.nonExistent` or disable it via `requiredTests: {nonExistent: false}`');
    }
    if (options.requiredTests.nonOwner === true) {
      assert(_.findWhere(childSuites, {_scenario: SCENARIO_NON_OWNER}),
        '`scenario.route(\'' + suite.fullTitle() + '\')` expected to have a nonOwner `scenario` but it didn\'t. ' +
        'Please add a `scenario.nonOwner` or disable it via `requiredTests: {nonOwner: false}`');
    }
  };
});

exports.scenario.routeTest = getDescribeWrapper(DEFAULT_ROUTE_TEST_OPTIONS,
    function _scenarioRouteTestWrapper (describeStr, options, describeFn) {
  return function scenarioRouteTestFn () {
    // Flag our suite with a scenario property
    this._scenario = SCENARIO_ROUTE_TEST;

    // Run our base setup
    _scenarioRouteTestBaseSetup.call(this, describeStr, options, describeFn);

    // Run describe actions
    describeFn.call(this);
  };
});
exports.scenario.loggedOut = getDescribeWrapper(_.defaults({
  // Set up no fixtures
  dbFixtures: null,
  // Don't set up Google server as we don't log in
  googleFixtures: []
}, DEFAULT_ROUTE_TEST_OPTIONS), function _scenarioLoggedOutWrapper (describeStr, options, describeFn) {
  return function scenarioLoggedOutFn () {
    this._scenario = SCENARIO_LOGGED_OUT;
    _scenarioRouteTestBaseSetup.call(this, describeStr, options, describeFn);
    describeFn.call(this);
  };
});
exports.scenario.nonExistent = getDescribeWrapper(DEFAULT_ROUTE_TEST_OPTIONS,
    function _scenarioNonExistentWrapper (describeStr, options, describeFn) {
  return function scenarioNonExistentFn () {
    this._scenario = SCENARIO_NON_EXISTENT;
    _scenarioRouteTestBaseSetup.call(this, describeStr, options, describeFn);
    describeFn.call(this);
  };
});
exports.scenario.nonOwner = getDescribeWrapper(DEFAULT_ROUTE_TEST_OPTIONS,
    function _scenarioNonOwnerWrapper (describeStr, options, describeFn) {
  return function scenarioNonOwnerFn () {
    this._scenario = SCENARIO_NON_OWNER;
    _scenarioRouteTestBaseSetup.call(this, describeStr, options, describeFn);
    describeFn.call(this);
  };
});

// Define model wrapper
exports.scenario.model = getDescribeWrapper({
  // Truncate all fixtures
  dbFixtures: [],
  // Don't set up Google server as we don't log in
  googleFixtures: [],
  // Don't start our server
  startServer: false
}, function _scenarioModelWrapper (describeStr, options, describeFn) {
  return function scenarioModelFn () {
    // Run describe actions
    _scenarioBaseSetup.call(this, describeStr, options, describeFn);
    describeFn.call(this);
  };
});

// Define job wrapper
exports.scenario.job = getDescribeWrapper({
  // Truncate all fixtures
  dbFixtures: [],
  // Don't set up Google server as we don't log in
  googleFixtures: [],
  // Don't start our server
  startServer: false
}, function _scenarioTaskWrapper (describeStr, options, describeFn) {
  return function scenarioTaskFn () {
    // Run describe actions
    _scenarioBaseSetup.call(this, describeStr, options, describeFn);
    describeFn.call(this);
  };
});

// Export `scenario` globally for simplicity
global.scenario = exports.scenario;
