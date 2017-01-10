// Load in our dependencies
var Sequelize = require('sequelize');
var QueryInterface = require('sequelize/lib/query-interface');
var baseDefine = require('../../models/base');

// Expose base define constants
Sequelize.ID = baseDefine.ID;
Sequelize.MOMENT_NO_TZ = baseDefine.MOMENT_NO_TZ;
Sequelize.MOMENT_TZ = baseDefine.MOMENT_TZ;

// Monkey patch Sequelize to require transactions
var _query = Sequelize.prototype.query;
Sequelize.prototype.query = function (sql, options) {
  // Fallback our options
  options = options || {};

  // Resolve our table name
  // DEV: Handles SequelizeMeta creation
  var tableName = options.tableName;
  // DEV: Handles SequelizeMeta row deletions
  if (!tableName && options.model) { tableName = options.model.name; }
  // DEV: Handles SequelizeMeta row insertions
  if (!tableName && options.instance) { tableName = options.instance.$modelOptions.tableName; }

  // If there is no transaction option and it isn't for our meta table, bail out
  if (!options.transaction && tableName !== 'SequelizeMeta') {
    throw new Error('Transaction not set in migration: ' + sql);
  }

  // Otherwise, run our normal function
  return _query.apply(this, arguments);
};

// Monkey patch QueryInterface to expand moment columns
// https://github.com/sequelize/sequelize/blob/v3.28.0/lib/query-interface.js#L73
var _createTable = QueryInterface.prototype.createTable;
QueryInterface.prototype.createTable = function (tableName, attributes, schemaOptions, model) {
  // Expand our moment columns with placeholder options
  baseDefine.expandMomentAttributes(attributes, {});

  // Call our original _createTable
  return _createTable.call(this, tableName, attributes, schemaOptions, model);
};

// Export patched Sequelize
module.exports = Sequelize;
