// Load in our dependencies
var Sequelize = require('sequelize');
var sequelize = require('../index.js').app.sequelize;

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
// DEV: We don't use `baseDefine` as this isn't a typical model
//   (e.g. no fancy getters, no audit hooks)
module.exports = sequelize.define('audit_log', {
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
}, {
  // TODO: Verify disabling timestamps is respected
  timestamps: false
});
