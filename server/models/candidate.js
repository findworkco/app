// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base.js');

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
// TODO: Add in support for `audit_log`
module.exports = _.extend(baseDefine('candidate', {
  id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
  // DEV: Sequelize interprets `unique` as an index key as well
  email: {
    type: Sequelize.STRING(255), unique: true, allowNull: false,
    validate: {isEmail: {msg: 'Invalid email provided'}}
  },
  // Google is: xxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
  //   but we are using 1024 to future proof in case this moves to another table
  google_access_token: {type: Sequelize.STRING(1024), allowNull: true}
}), exports);
