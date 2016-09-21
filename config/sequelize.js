// Load in our dependencies
var _ = require('underscore');
var staticDatabase = require('./static-database.js');

// Export our various environments
// DEV: We set environment via `.sequelizerc`
exports.development = _.extend({dialect: 'postgres'}, staticDatabase.development.postgresql);
exports.test = _.extend({dialect: 'postgres'}, staticDatabase.test.postgresql);
exports.production = _.extend({dialect: 'postgres'}, staticDatabase.production.postgresql);
