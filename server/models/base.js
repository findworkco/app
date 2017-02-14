// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var inflection = require('inflection');
var moment = require('moment-timezone');
var Sequelize = require('sequelize');
var timezones = require('../utils/tz-stable.js');
var customTypes = require('./utils/custom-types');
var AuditLog = require('./audit-log');
var sequelize =  require('./_sequelize');
// DEV: Legacy assertion for circular dependencies
assert(AuditLog.build);

// Expose our custom types
// DEV: We originally had a `DATEONLY` type but additionally storing time costs only a little extra on space
//   and it makes developer maintenance 2 things instead of 3 things
//   and we get consistently named columns, making it easier to potentially switch between `TZ`/`NO_TZ`
exports.ID = customTypes.ID;
exports.MOMENT_NO_TZ = 'MOMENT_NO_TZ';
exports.MOMENT_TZ = 'MOMENT_TZ';

// Override moment to check timezones
var _momentFormat = moment.prototype.format;
moment.prototype.format = function () {
  // Verify we have a timezone
  assert(this.tz(), '`moment.format` expected to have a timezone defined but none was. ' +
    'Please set a timezone via `tz` before using `format`');

  // Call our normal function
  return _momentFormat.apply(this, arguments);
};

// Resolve our timezone values
// [{countryCode: 'US', name: 'United States', locales:
//   [{ianaTimezone: 'America/Chicago', abbrStr: 'CST/CDT', val: 'US-America/Chicago'}, ...], ...]
// to
// ['US-America/Chicago', ...]
var validTimezoneValues = exports.validTimezoneValues = [];
timezones.forEach(function extractTimezoneValues (timezone) {
  timezone.locales.forEach(function extractLocaleValues (locale) {
    validTimezoneValues.push(locale.val);
  });
});

// Define our model definer
// https://github.com/sequelize/sequelize/blob/v3.24.6/lib/sequelize.js#L602
exports.expandMomentAttributes = function (attributes, options) {
  // Walk over our attributes
  Object.keys(attributes).forEach(function handleAttribute (attributeKey) {
    // If the attribute is a moment with no timezone
    var attribute = attributes[attributeKey];
    var dateTimeKey, timezoneKey, momentKey;
    if (attribute.type === exports.MOMENT_NO_TZ) {
      // Replace original attribute with database column
      // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/data-types.js#L441-L459
      // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/dialects/postgres/data-types.js#L101-L105
      delete attributes[attributeKey];
      assert.notEqual(attributeKey.indexOf('_moment'), -1,
        'Expected `_moment` suffix on "' + attributeKey + '" for "MOMENT_NO_TZ" type');
      dateTimeKey = attributeKey.replace('_moment', '_datetime');
      attributes[dateTimeKey] = _.defaults({
        type: Sequelize.DATE
      }, attribute);

      // Add getter/setters
      momentKey = attributeKey;
      options.getterMethods = options.getterMethods ? _.clone(options.getterMethods) : {};
      options.setterMethods = options.setterMethods ? _.clone(options.setterMethods) : {};
      options.getterMethods[momentKey] = function () {
        var val = this.get(dateTimeKey);
        return val !== null ? moment(val) : val;
      };
      options.setterMethods[momentKey] = function (_moment) {
        // http://momentjs.com/docs/#/displaying/as-javascript-date/
        if (_moment !== null) {
          this.set(dateTimeKey, _moment.toDate());
        } else {
          this.set(dateTimeKey, null);
        }
      };
    // Otherwise, if the attribute is a moment with a timezone
    } else if (attribute.type === exports.MOMENT_TZ) {
      // Replace original attribute with database columns
      delete attributes[attributeKey];
      assert.notEqual(attributeKey.indexOf('_moment'), -1,
        'Expected `_moment` suffix on "' + attributeKey + '" for "MOMENT_TZ" type');
      // archived_at_moment -> archived_at_datetime
      // archived_at_moment -> archived_at_timezone
      // archived_at_moment -> bothArchivedAtValuesOrNone
      dateTimeKey = attributeKey.replace('_moment', '_datetime');
      timezoneKey = attributeKey.replace('_moment', '_timezone');
      var validateKey = inflection.camelize('both_' + attributeKey.replace('_moment', '_values_or_none'), true);
      attributes[dateTimeKey] = _.defaults({
        type: Sequelize.DATE
      }, attribute);
      // DEV: For safety, we will keep 255 characters -- we prob could do 64 but why risk it
      // jscs:disable maximumLineLength
      // DEV: Longest timezone in moment-timezone is 32 characters long (+3 for ISO code and '-')
      //   require('underscore').values(require('moment-timezone').tz._names).sort(function (a, b) { return a.length - b.length; });
      //   Longest: America/Argentina/ComodRivadavia
      // jscs:enable maximumLineLength
      // DEV: We intentionally overwrite `validate` so `datetime` can use `_moment's` validation for `<`/`>` comparison
      attributes[timezoneKey] = _.defaults({
        type: Sequelize.STRING(255),
        validate: {isIn: {args: [validTimezoneValues], msg: 'Invalid timezone provided'}}
      }, attribute);

      // Add getter/setters and validation
      momentKey = attributeKey;
      options.getterMethods = options.getterMethods ? _.clone(options.getterMethods) : {};
      options.setterMethods = options.setterMethods ? _.clone(options.setterMethods) : {};
      options.validate = options.validate ? _.clone(options.validate) : {};
      options.getterMethods[momentKey] = function () {
        var dateTimeVal = this.get(dateTimeKey);
        var timezoneVal = this.get(timezoneKey);
        if ((dateTimeVal === null || dateTimeVal === undefined) &&
            (timezoneVal === null || timezoneVal === undefined)) {
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
          this.set(dateTimeKey, _moment.toDate());
          this.set(timezoneKey, _moment.tz());
        } else {
          this.set(dateTimeKey, null);
          this.set(timezoneKey, null);
        }
      };
      // http://docs.sequelizejs.com/en/v3/docs/models-definition/#model-validations
      options.validate[validateKey] = function () {
        // DEV: We reuse our getter as it already performs our assertions
        void this.get(momentKey);
      };
    }
  });
};

module.exports = _.extend(function (modelName, attributes, options) {
  // Fallback/clone our options (prevents contamination)
  options = options ? _.clone(options) : {};

  // Expand our moment attributes
  exports.expandMomentAttributes(attributes, options);

  // Add hooks for audit logging
  // http://docs.sequelizejs.com/en/v3/docs/hooks/#declaring-hooks
  // http://docs.sequelizejs.com/en/v3/docs/hooks/#model-hooks
  function saveAuditLog(action, model, options) {
    // Verify we are being run in a transaction
    // DEV: _allowNoTransaction for testing models only, please always use a transaction in the server
    if (options._allowNoTransaction !== true) {
      assert(options.transaction, 'All create/update/delete actions must be run in a transaction to ' +
        'prevent orphaned AuditLogs or connected models on save (e.g. Application <-> Reminder). ' +
        'Please add a transaction to your current "' + action + '" request');
    }

    // Resolve our model's constructor
    var Model = model.Model;
    var attributeKeys = Object.keys(Model.attributes);
    var auditLog = AuditLog.build({
      source_type: options._sourceType, // 'server', 'candidates'
      source_id: options._sourceId, // NULL (server), candidate.id
      table_name: Model.tableName,
      table_row_id: model.get('id'),
      action: action,
      timestamp: new Date(),
      // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/instance.js#L86-L87
      // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/instance.js#L417-L433
      previous_values: _.pick(model._previousDataValues, attributeKeys),
      current_values: _.pick(model.dataValues, attributeKeys),
      transaction_id: options.transaction ? options.transaction.id : null
    });
    return auditLog.save({transaction: options.transaction});
  }
  options.hooks = _.extend({
    // DEV: We don't support bulk actions due to not knowing previous/current info for models
    beforeBulkCreate: function () {
      throw new Error('Audit logging not supported for bulk creation; either add support or use `create` directly');
    },
    beforeBulkUpdate: function () {
      throw new Error('Audit logging not supported for bulk updates; either add support or use `create` directly');
    },
    beforeBulkDelete: function () {
      throw new Error('Audit logging not supported for bulk deletion; either add support or use `create` directly');
    },
    afterCreate: function (model, options) {
      return saveAuditLog('create', model, options);
    },
    afterUpdate: function (model, options) {
      return saveAuditLog('update', model, options);
    },
    afterDelete: function (model, options) {
      return saveAuditLog('delete', model, options);
    }
  }, options.hooks);

  // Build our class
  return sequelize.define(modelName, attributes, options);
}, exports);
