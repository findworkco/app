// Load in our dependencies
var Interview = require('../interview');
var Reminder = require('../reminder');

// Define common query includes
// DEV: We place these in a separate file from models to prevent circular dependencies between models
// TODO: Only load closest past interview
exports.closestPastInterview = {model: Interview};
// TODO: Only load closest upcoming interview
exports.closestUpcomingInterview = {model: Interview};
exports.applicationNavContent = [
  // TODO: Selectively only load closest upcoming/past interviews
  {model: Interview}, // Closest upcoming interview, closest past interview (last contact)
  {model: Reminder, as: 'saved_for_later_reminder'},
  {model: Reminder, as: 'waiting_for_response_reminder'},
  {model: Reminder, as: 'received_offer_reminder'}
];
