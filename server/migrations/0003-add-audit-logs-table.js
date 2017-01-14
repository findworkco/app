// Load in our dependencies
var Promise = require('bluebird');
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.createTable('audit_logs', {
      id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
      source_type: {type: Sequelize.STRING(255), allowNull: false},
      source_id: {type: Sequelize.UUID, allowNull: true},
      table_name: {type: Sequelize.STRING(255), allowNull: false},
      table_row_id: {type: Sequelize.UUID, allowNull: false},
      action: {type: Sequelize.STRING(32), allowNull: false},
      timestamp: {type: Sequelize.DATE, allowNull: false},
      previous_values: {type: Sequelize.JSON, allowNull: false},
      current_values: {type: Sequelize.JSON, allowNull: false}
    }, {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.dropTable('audit_logs', {transaction: t})
  ]); });
};
