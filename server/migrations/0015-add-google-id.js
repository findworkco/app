// Load in our dependencies
var Promise = require('bluebird');
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
// DEV: When we land this migration, we must manually empty the `google_access_token` column
//   and flush sessions so we can properly fill `google_id` without validation errors
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.addColumn('candidates', 'google_id',
      {type: Sequelize.STRING(64), allowNull: true}, {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.removeColumn('candidates', 'google_id', {transaction: t})
  ]); });
};
