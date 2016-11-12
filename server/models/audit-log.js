// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Sequelize = require('sequelize');
var sequelize = require('../index.js').app.sequelize;

// Define our constants
exports.ACTION_CREATE = 'create';
exports.ACTION_UPDATE = 'update';
exports.ACTION_DELETE = 'delete';
exports.VALID_ACTIONS = [exports.ACTION_CREATE, exports.ACTION_UPDATE, exports.ACTION_DELETE];

exports.SOURCE_CANDIDATES = 'candidates';
exports.SOURCE_SERVER = 'server';
exports.VALID_SOURCES = [exports.SOURCE_CANDIDATES, exports.SOURCE_SERVER];

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
// DEV: We don't use `baseDefine` as this isn't a typical model
//   (e.g. no fancy getters, no audit hooks)
// DEV: Based on memory, verified by http://stackoverflow.com/a/2015276
module.exports = _.extend(sequelize.define('audit_log', {
  id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
  // 'server', 'candidates', etc
  // DEV: Validation for `source_id` being set for non-server type is in options
  source_type: {
    type: Sequelize.STRING(255), allowNull: false,
    validate: {isIn: {args: exports.VALID_SOURCES, msg: 'Source must be server or candidates'}}
  },
  source_id: {type: Sequelize.UUID, allowNull: true},

  // 'candidates', 'applications', interviews', etc
  table_name: {type: Sequelize.STRING(255), allowNull: false},
  table_row_id: {type: Sequelize.UUID, allowNull: false},

  // 'create', 'update', 'delete'
  action: {
    type: Sequelize.STRING(32), allowNull: false,
    validate: {isIn: {args: exports.VALID_ACTIONS, msg: 'Action must be create, update, or delete'}}
  },

  // 2016-01-01T00:00:00Z
  timestamp: {type: Sequelize.DATE, allowNull: false}

  // {id: abc, email: abc1, password: ***, ...}
  // previous_values
  // {id: abc, email: abc2, password: ***, ...}
  // current_values
}, {
  validate: {
    requireSourceId: function () {
      if (this.getDataValue('source_type') !== exports.SOURCE_SERVER) {
        assert(this.getDataValue('source_id'), 'source_id required for non-server sources in audit log');
      }
    }
  },

  // Disable `created_at`/`updated_at` timestamps
  timestamps: false
}, exports));
