// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var baseDefine = require('./base.js');
var Sequelize = require('sequelize');

// Define our constants
exports.PARENT_TYPES = {
  APPLICATION: 'application',
  INTERVIEW: 'interview'
};

var APPLICATION_TYPES = {
  SAVED_FOR_LATER: 'saved_for_later',
  WAITING_FOR_RESPONSE: 'waiting_for_response',
  RECEIVED_OFFER: 'received_offer'
};
var INTERVIEW_TYPES = {
  PRE_INTERVIEW: 'pre_interview',
  POST_INTERVIEW: 'post_interview'
};
exports.TYPES = _.extend({}, APPLICATION_TYPES, INTERVIEW_TYPES);

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
module.exports = _.extend(baseDefine('reminder', {
  id: {
    type: baseDefine.ID, defaultValue: Sequelize.UUIDV4, primaryKey: true,
    validate: {isUUID: 4}
  },

  // TODO: Create a non-unique index with PARENT_TYPE and PARENT_ID (multiple reminders per application)
  parent_id: {
    // DEV: Since this isn't a foreign key, we can use `isUUID` as a sanity check
    type: baseDefine.ID, allowNull: false,
    validate: {isUUID: 4}
  },
  parent_type: {
    type: Sequelize.STRING(36), allowNull: false,
    validate: {isIn: {args: [_.values(exports.PARENT_TYPES)], msg: 'Parent type must be application or interview'}}
  },

  // Same length as Application.status
  // DEV: We have `type` defined on reminder to self-contain historical data
  //   For example, if we have multiple follow up reminders, then we can know when last ones were sent
  // DEV: We don't replace `parent_type` entirely for ease of look up/indexing and simplicity in code
  type: {
    type: Sequelize.STRING(36), allowNull: false,
    validate: {isIn: {args: [_.values(exports.TYPES)], msg: 'Invalid type provided'}}
  },

  date_time_moment: {type: baseDefine.MOMENT_TZ, allowNull: false},
  is_enabled: {type: Sequelize.BOOLEAN, allowNull: false},
  sent_at_moment: {type: baseDefine.MOMENT_DATEONLY, defaultValue: null, allowNull: true}
}, {
  validate: {
    typeMatchesParentType: function () {
      var allowedTypesMap = this.getDataValue('parent_type') === exports.PARENT_TYPES.APPLICATION ?
        APPLICATION_TYPES : INTERVIEW_TYPES;
      var allowedTypes = _.values(allowedTypesMap);
      assert.notEqual(allowedTypes.indexOf(this.getDataValue('type')), -1, '`type` is not valid for `parent_type`. ' +
        'Please use application types for application reminders and similarly for inteviews/interview reminders');
    }
  }
}), exports);
