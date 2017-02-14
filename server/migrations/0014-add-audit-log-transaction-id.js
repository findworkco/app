// Load in our dependencies
var Promise = require('bluebird');
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.addColumn('audit_logs', 'transaction_id',
      {type: Sequelize.UUID, allowNull: true}, {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.removeColumn('audit_logs', 'transaction_id', {transaction: t})
  ]); });
};
