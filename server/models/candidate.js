// Load in our dependencies
var assert = require('assert');
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
  // DEV: we are using 64 to future proof in case this moves to another table
  // Example: 105517022105765304949 for https://plus.google.com/105517022105765304949
  google_id: {type: Sequelize.STRING(64), unique: true, allowNull: true},
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
  validate: {
    bothGoogleValuesOrNone: function () {
      var googleIdVal = this.get('google_id');
      var googleAccessTokenVal = this.get('google_access_token');
      if ((googleIdVal === null || googleIdVal === undefined) &&
          (googleAccessTokenVal === null || googleAccessTokenVal === undefined)) {
        return;
      }
      assert.notEqual(googleIdVal, null, 'Expected "google_id" to not be null when ' +
        '"google_access_token" wasn\'t null but it was');
      assert.notEqual(googleAccessTokenVal, null, 'Expected "google_access_token" to not be null when ' +
        '"google_id" wasn\'t null but it was');
    }
  },
  getterMethods: {
    add_application_url: function () {
      return '/add-application';
    },
    external_add_application_url: function () {
      return getExternalUrl(this.get('add_application_url'));
    }
  },
  setterMethods: {
    email: function (value) {
      if (typeof value === 'string') {
        return this.setDataValue('email', value.toLowerCase());
      } else {
        return this.setDataValue('email', value);
      }
    }
  }
}), exports);
