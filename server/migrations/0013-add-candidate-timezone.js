// Load in our dependencies
var multiline = require('multiline');
var Promise = require('bluebird');
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // Add our column in a nullable fashion, backfill it, and move it back to NOT NULL
    // DEV: Normally we don't backfill in the migration as it can cause long locks
    //   However, we are in restricted production so there's little chance of locking
    queryInterface.addColumn('candidates', 'timezone',
      {type: Sequelize.STRING(255), allowNull: true}, {transaction: t})
    .then(function () {
      return queryInterface.sequelize.query(multiline(function () {/*
        UPDATE candidates SET timezone='US-America/Los_Angeles';
      */}), {transaction: t});
    })
    .then(function () {
      return queryInterface.changeColumn('candidates', 'timezone',
        {type: Sequelize.STRING(255), allowNull: false}, {transaction: t});
    })
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.removeColumn('candidates', 'timezone', {transaction: t})
  ]); });
};
