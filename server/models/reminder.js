// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var baseDefine = require('./base.js');
var Candidate = require('./candidate');
var Sequelize = require('sequelize');

// DEV: Reminder serves as a base model for ApplicationReminder and InterviewReminder
//   We leverage PostgreSQL table inheritance to manage insertions on `application_reminders` and `interview_reminders`
//   As a benefit, we can query the `reminders` table but lose out on `application_id`/`interview_id`
//   We chose to use inheritance as we have buy-in to PostgreSQL and probably won't be leaving soon
//     In addition, if we ever leave it, we can easily expand `reminders` inheritance into separate tables
//     As a result, it's 90% win to 10% possibility of being painful -- good odds for now
//   https://www.postgresql.org/docs/9.3/static/ddl-inherit.html

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
// DEV: We expose `_cleanAttributes` to avoid inheriting from `baseDefine` mutated attributes
var modelName = 'reminder';
var attributes = exports._cleanAttributes = {
  id: {
    type: baseDefine.ID, defaultValue: Sequelize.UUIDV4, primaryKey: true,
    validate: {isUUID: 4}
  },
  candidate_id: {
    type: baseDefine.ID, allowNull: false,
    references: {model: Candidate, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'CASCADE'
  },

  // Same length as Application.status
  // DEV: We have `type` defined on reminder to self-contain historical data
  //   For example, if we have multiple follow up reminders, then we can know when last ones were sent
  // DEV: We don't replace `parent_type` entirely for ease of look up/indexing and simplicity in code
  type: {
    type: Sequelize.STRING(36), allowNull: false,
    validate: {
      isIn: function (value) {
        // Verify we are in a child class of Reminder
        var validTypes = this.$modelOptions.VALID_TYPES;
        assert(validTypes,
          '`type` requires `VALID_TYPES` to be set on child class of Reminder (e.g. ApplicationReminder)');

        // Verify we have our type
        assert.notEqual(validTypes.indexOf(value), -1, 'Invalid type provided. ' +
          'Please verify it aligns with VALID_TYPES');
      }
    }
  },

  date_time_moment: {type: baseDefine.MOMENT_TZ, allowNull: false},
  is_enabled: {type: Sequelize.BOOLEAN, allowNull: false},
  sent_at_moment: {type: baseDefine.MOMENT_DATEONLY, defaultValue: null, allowNull: true}
};
var options = {
  hooks: {
    // http://docs.sequelizejs.com/en/v3/docs/hooks/#declaring-hooks
    // http://docs.sequelizejs.com/en/v3/docs/hooks/#model-hooks
    beforeBulkCreate: function () {
      throw new Error('Bulk creation of Reminder not supported. ' +
        'Please use ApplicationReminder or InterviewReminder instead');
    },
    beforeBulkDelete: function () {
      throw new Error('Bulk deletion of Reminder not supported. ' +
        'Please use ApplicationReminder or InterviewReminder instead');
    },
    beforeCreate: function () {
      throw new Error('Direct creation of Reminder not supported. ' +
        'Please use ApplicationReminder or InterviewReminder instead');
    },
    beforeDelete: function () {
      throw new Error('Direct deletion of Reminder not supported. ' +
        'Please use ApplicationReminder or InterviewReminder instead');
    }
  }
};
var Reminder = module.exports = _.extend(
  baseDefine(modelName, _.clone(attributes), _.clone(options)), exports);

// DEV: To prevent circular dependencies, we define parent/child relationships in model where foreign key is
Reminder._bindAssociations = function () {
  Reminder.belongsTo(Candidate);
  Candidate.hasMany(Reminder);
};
Reminder._bindAssociations();
