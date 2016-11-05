// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var moment = require('moment-timezone');
var Sequelize = require('sequelize');
var sequelize = require('../index.js').app.postgresqlClient;

// Define our custom types
exports.MOMENT_DATEONLY = 'MOMENT_DATEONLY';
exports.MOMENT_TZ = 'MOMENT_TZ';

// Define our model definer
// https://github.com/sequelize/sequelize/blob/v3.24.6/lib/sequelize.js#L602
module.exports = _.extend(function (modelName, attributes, options) {
  // Fallback/clone our options (prevents contamination)
  options = options ? _.clone(options) : {};

  // Walk over our attributes
  Object.keys(attributes).forEach(function handleAttribute (attributeKey) {
    // If the attribute is a moment with no timezone
    var attribute = attributes[attributeKey];
    var dateTimeKey, timezoneKey, momentKey;
    if (attribute.type === exports.MOMENT_DATEONLY) {
      // Replace original attribute with database column
      delete attributes[attributeKey];
      assert.notEqual(attributeKey.indexOf('_moment'), -1,
        'Expected `_moment` suffix on "' + attributeKey + '" for "MOMENT_DATEONLY" type');
      dateTimeKey = attributeKey.replace('_moment', '_date');
      attributes[dateTimeKey] = _.defaults({
        type: Sequelize.DATEONLY
      }, attribute);

      // Add getter/setters
      momentKey = attributeKey;
      options.getterMethods = options.getterMethods ? _.clone(options.getterMethods) : {};
      options.setterMethods = options.setterMethods ? _.clone(options.setterMethods) : {};
      options.getterMethods[momentKey] = function () {
        var val = this.getDataValue(dateTimeKey);
        return val !== null ? moment(val) : val;
      };
      options.setterMethods[momentKey] = function (_moment) {
        // http://momentjs.com/docs/#/displaying/as-javascript-date/
        if (_moment !== null) {
          this.setDataValue(dateTimeKey, _moment.toDate());
        } else {
          this.setDataValue(dateTimeKey, null);
        }
      };
    // Otherwise, if the attribute is a moment with a timezone
    } else if (attribute.type === exports.MOMENT_TZ) {
      // Replace original attribute with database columns
      delete attributes[attributeKey];
      assert.notEqual(attributeKey.indexOf('_moment'), -1,
        'Expected `_moment` suffix on "' + attributeKey + '" for "MOMENT_TZ" type');
      dateTimeKey = attributeKey.replace('_moment', '_datetime');
      timezoneKey = attributeKey.replace('_moment', '_timezone');
      // TODO: Fix up validation for dateTime so we can have `<` or `>` other date times
      //   This is likely by not reusing validation for timezone
      attributes[dateTimeKey] = _.defaults({
        type: Sequelize.DATE
      }, attribute);
      // TODO: Correct timezone with proper maximum IANA length
      // TODO: Add validation timezone is not undefined and is proper timezone
      attributes[timezoneKey] = _.defaults({
        type: Sequelize.STRING(255)
      }, attribute);

      // Add getter/setters
      momentKey = attributeKey;
      options.getterMethods = options.getterMethods ? _.clone(options.getterMethods) : {};
      options.setterMethods = options.setterMethods ? _.clone(options.setterMethods) : {};
      options.getterMethods[momentKey] = function () {
        var dateTimeVal = this.getDataValue(dateTimeKey);
        var timezoneVal = this.getDataValue(timezoneKey);
        if (dateTimeVal === null && timezoneVal === null) {
          return null;
        }
        assert.notEqual(dateTimeVal, null, 'Expected "' + dateTimeKey + '" to not be null when "' +
            timezoneKey + '" wasn\'t null but it was');
        assert.notEqual(timezoneVal, null, 'Expected "' + timezoneKey + '" to not be null when "' +
            dateTimeKey + '" wasn\'t null but it was');
        return moment.tz(dateTimeVal, timezoneVal);
      };
      options.setterMethods[momentKey] = function (_moment) {
        // http://momentjs.com/docs/#/displaying/as-javascript-date/
        // DEV: We have no numeric offset for `moment.tz`
        //   allowing it to set the appropriate one from the IANA timezone
        if (_moment !== null) {
          var timezone = _moment.tz();
          assert(timezone, 'Expected timezone to be set for "' + momentKey + '" but it wasn\'t');
          this.setDataValue(dateTimeKey, _moment.toDate());
          this.setDataValue(timezoneKey, _moment.tz());
        } else {
          this.setDataValue(dateTimeKey, null);
          this.setDataValue(timezoneKey, null);
        }
      };
    }
  });

  // Enable timestamps as underscored attributes
  // http://docs.sequelizejs.com/en/v3/docs/models-definition/#configuration
  // DEV: This code is untested, please test it
  if (options.timestamps === undefined) {
    options.timestamps = true;
  }
  options.underscored = true;

  // Build our class
  return sequelize.define(modelName, attributes, options);
}, exports);