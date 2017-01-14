// Load in our dependencies
var Promise = require('bluebird');
var Sequelize = require('./utils/sequelize'); /* Ignore unused Sequelize */ // jshint ignore:line

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // queryInterface interactions go here
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // queryInterface interactions go here
  ]); });
};
