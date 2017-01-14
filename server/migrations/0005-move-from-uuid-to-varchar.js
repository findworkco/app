// Load in our dependencies
// DEV: We load Sequelize for transaction requirement
var multiline = require('multiline');
var Promise = require('bluebird');
void require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
// DEV: Sequelize's changeColumn doesn't work with ALTER COLUMN due to apparently doing a DROP COLUMN on a primary key
//   Instead we do our ALTER TABLE manually
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.sequelize.query(multiline(function () {/*
      ALTER TABLE candidates ALTER COLUMN id TYPE VARCHAR(36);
      ALTER TABLE audit_logs ALTER COLUMN id TYPE VARCHAR(36);
      ALTER TABLE audit_logs ALTER COLUMN source_id TYPE VARCHAR(36);
      ALTER TABLE audit_logs ALTER COLUMN table_row_id TYPE VARCHAR(36);
    */}), {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // We could undo alterations but that won't solve any problems =/
  ]); });
};
