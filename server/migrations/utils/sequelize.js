// Load in our dependencies
var Sequelize = require('sequelize');

// Monkey patch Sequelize to require transactions
var _query = Sequelize.prototype.query;
Sequelize.prototype.query = function (sql, options) {
  // If there is no transaction option and it isn't for our meta table, bail out
  // DEV: Handles SequelizeMeta creation
  var tableName = options.tableName;
  // DEV: Handles SequelizeMeta row deletions
  if (!tableName && options.model) { tableName = options.model.name; }
  // DEV: Handles SequelizeMeta row insertions
  if (!tableName && options.instance) { tableName = options.instance.$modelOptions.tableName; }
  if (!options.transaction && tableName !== 'SequelizeMeta') {
    throw new Error('Transaction not set in migration: ' + sql);
  }

  // Otherwise, run our normal function
  return _query.apply(this, arguments);
};

// Export patched Sequelize
module.exports = Sequelize;
