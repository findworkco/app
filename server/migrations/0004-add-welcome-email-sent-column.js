// Load in our dependencies
var Sequelize = require('./utils/sequelize');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.addColumn('candidates', 'welcome_email_sent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }, {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.removeColumn('candidates', 'welcome_email_sent', {transaction: t})
  ]); });
};
