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
    //   However, `interviews` isn't live in production yet so there's no chance of locking
    queryInterface.addColumn('interviews', 'type',
      {type: Sequelize.STRING(36), allowNull: true}, {transaction: t})
    .then(function () {
      return queryInterface.sequelize.query(multiline(function () {/*
        UPDATE interviews SET type='upcoming_interview' WHERE date_time_datetime > NOW();
        UPDATE interviews SET type='past_interview' WHERE date_time_datetime < NOW();
      */}), {transaction: t});
    })
    .then(function () {
      return queryInterface.changeColumn('interviews', 'type',
        {type: Sequelize.STRING(36), allowNull: false}, {transaction: t});
    })
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.removeColumn('interviews', 'type', {transaction: t})
  ]); });
};
