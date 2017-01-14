// Load in our dependencies
var Promise = require('bluebird');
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.createTable('candidates', {
      id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
      email: {type: Sequelize.STRING(255), unique: true, allowNull: false},
      google_access_token: {type: Sequelize.STRING(1024), allowNull: true},

      // Manually add timestamps (sequelize-cli doesn't inherit options)
      // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/model.js#L191-L204
      created_at: {type: Sequelize.DATE, allowNull: false, _autoGenerated: true},
      updated_at: {type: Sequelize.DATE, allowNull: false, _autoGenerated: true}
    }, {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.dropTable('candidates', {transaction: t})
  ]); });
};
