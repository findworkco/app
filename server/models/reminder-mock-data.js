// Load in our dependencies
var assert = require('assert');
var Reminder = require('./reminder');
var genericMockData = require('./generic-mock-data');

// Generate reminder map by ids
var remindersById = {};
genericMockData.reminders.forEach(function saveReminderById (reminder) {
  assert(reminder.id, 'No id found for reminder: ' + JSON.stringify(reminder));
  remindersById[reminder.id] = reminder;
});

// Define reminder builder
function buildReminder(reminderAttributes) {
  // Build and return our reminder
  var retVal = Reminder.build(reminderAttributes).get({plain: true, clone: true});
  return retVal;
}

// Export reminder mock data resolver
exports.getById = function (id) {
  return remindersById.hasOwnProperty(id) ? buildReminder(remindersById[id]) : null;
};
