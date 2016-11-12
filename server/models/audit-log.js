// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var sequelize = require('../index.js').app.sequelize;

// Define our constants
exports.ACTION_CREATE = 'create';
exports.ACTION_UPDATE = 'update';
exports.ACTION_DELETE = 'delete';
exports.VALID_ACTIONS = [exports.ACTION_CREATE, exports.ACTION_UPDATE, exports.ACTION_DELETE];

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
// DEV: We don't use `baseDefine` as this isn't a typical model
//   (e.g. no fancy getters, no audit hooks)
// DEV: Based on memory, verified by http://stackoverflow.com/a/2015276
module.exports = _.extend(sequelize.define('audit_log', {
  id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
  // source_type
  // source_id
  table_name: {type: Sequelize.STRING(255), allowNull: false},
  table_row_id: {type: Sequelize.UUID, allowNull: false},
  action: {
    type: Sequelize.STRING(32), allowNull: false,
    validate: {isIn: {args: exports.VALID_ACTIONS, msg: 'Action must be create, update, or delete'}}
  },
  timestamp: {type: Sequelize.DATE, allowNull: false}
  // previous_values
  // current_values
}, {
  timestamps: false
}, exports));
