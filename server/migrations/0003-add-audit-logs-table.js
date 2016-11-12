// Load in our dependencies
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.createTable('audit_logs', {
      id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
      // source_type
      // source_id
      table_name: {type: Sequelize.STRING(255), allowNull: false},
      table_row_id: {type: Sequelize.UUID, allowNull: false},
      // TODO: Add validation that it's create, update, or delete (prob use constants)
      action: {type: Sequelize.STRING(32), allowNull: false}
      // timestamp
      // previous_values
      // current_values
    }, {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.dropTable('audit_logs', {transaction: t})
  ]); });
};
