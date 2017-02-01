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
    queryInterface.addColumn('interviews', 'can_send_reminders',
      {type: Sequelize.BOOLEAN, allowNull: true}, {transaction: t})
    .then(function () {
      return queryInterface.sequelize.query(multiline(function () {/*
        UPDATE interviews SET can_send_reminders=TRUE WHERE type = 'upcoming_interview';
        UPDATE interviews SET can_send_reminders=FALSE WHERE type = 'past_interview';
      */}), {transaction: t});
    })
    .then(function () {
      return queryInterface.changeColumn('interviews', 'can_send_reminders',
        {type: Sequelize.BOOLEAN, allowNull: false}, {transaction: t});
    })
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.removeColumn('interviews', 'can_send_reminders', {transaction: t})
  ]); });
};
