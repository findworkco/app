// Load in our dependencies
var _ = require('underscore');
var Sequelize = require('sequelize');
var baseDefine = require('./base');
var Application = require('./application');
var Reminder = require('./reminder');

// Define our constants
exports.TYPES = {
  SAVED_FOR_LATER: 'saved_for_later',
  WAITING_FOR_RESPONSE: 'waiting_for_response',
  RECEIVED_OFFER: 'received_offer'
};

// Define and export our model
// http://docs.sequelizejs.com/en/v3/docs/models-definition/
var ApplicationReminder = module.exports = _.extend(baseDefine('application_reminder', _.defaults({
  application_id: {
    type: baseDefine.ID, allowNull: false,
    // DEV: Additionally, we make our foreign key double bound to Application's application_id/candidate_id via SQL
    //   This is to prevent candidate_id ever getting out of sync via attacks
    references: {model: Application, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED},
    onUpdate: 'CASCADE', onDelete: 'CASCADE'
  }
}, Reminder._cleanAttributes), {
  VALID_TYPES: _.values(exports.TYPES)
}), exports);
// DEV: To prevent circular dependencies, we define parent/child relationships in model where foreign key is
//   Unfortunately, Application/ApplicationReminder both have foreign keys so we choose the stronger form
Application._reminderKeys.forEach(function bindReminderKeyAssociation (key) {
  // DEV: We use `belongsTo` as `hasOne` has a flipped relationship for source/target
  // https://github.com/sequelize/sequelize/pull/7115
  Application.belongsTo(ApplicationReminder, {as: key});
});
ApplicationReminder.belongsTo(Application);
Application.hasMany(ApplicationReminder);

// Set up inherited bindings (e.g. Candidate)
Reminder._bindAssociations(ApplicationReminder);
