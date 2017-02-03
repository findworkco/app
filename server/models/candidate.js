// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base.js');

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
module.exports = _.extend(baseDefine('candidate', {
  id: {
    type: baseDefine.ID, defaultValue: Sequelize.UUIDV4, primaryKey: true,
    validate: {isUUID: 4}
  },
  // DEV: Sequelize interprets `unique` as an index key as well
  email: {
    type: Sequelize.STRING(255), unique: true, allowNull: false,
    validate: {isEmail: {msg: 'Invalid email provided'}}
  },
  // Google is: xxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
  //   but we are using 1024 to future proof in case this moves to another table
  google_access_token: {type: Sequelize.STRING(1024), allowNull: true},
  welcome_email_sent: {type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false}
}, {
  getterMethods: {
    timezone: function () {
      // Placeholder for candidate timezone, should be resolved via IP initially and managed by settings
      return 'US-America/Chicago';
    }
  }
}), exports);
