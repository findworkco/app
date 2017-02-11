// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base.js');
var getExternalUrl = require('../utils/url').getExternalUrl;

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
  // Same length as `baseDefine's timezone` columns
  // Examples: US-America/Chicago, GB-Europe/London
  timezone: {
    type: Sequelize.STRING(255), allowNull: false,
    validate: {isIn: {args: [baseDefine.validTimezoneValues], msg: 'Invalid timezone provided'}}
  },
  welcome_email_sent: {type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false}
}, {
  getterMethods: {
    add_application_url: function () {
      return '/add-application';
    },
    external_add_application_url: function () {
      return getExternalUrl(this.get('add_application_url'));
    }
  }
}), exports);
