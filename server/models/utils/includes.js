// Load in our dependencies
var Candidate = require('../candidate');
var Interview = require('../interview');
var ApplicationReminder = require('../application-reminder');

// Define common query includes
// DEV: We place these in a separate file from models to prevent circular dependencies between models
// TODO: Only load closest past interview
exports.closestPastInterview = {model: Interview};
// TODO: Only load closest upcoming interview
exports.closestUpcomingInterview = {model: Interview};
exports.applicationNavContent = [
  // TODO: Selectively only load closest upcoming/past interviews https://trello.com/c/oU1IN4V1/253-consider-moving-past-interviews-and-upcoming-interviews-to-independent-queries
  {model: Interview}, // Closest upcoming interview, closest past interview (last contact)
  {model: ApplicationReminder, as: 'saved_for_later_reminder'},
  {model: ApplicationReminder, as: 'waiting_for_response_reminder'},
  {model: ApplicationReminder, as: 'received_offer_reminder'}
];
exports.updateInterviewApplication = [{
  model: Candidate
}, {
  model: Interview
}, {
  // DEV: We include `saved_for_later` to detect expiration
  model: ApplicationReminder,
  as: 'saved_for_later_reminder'
}, {
  // DEV: We include `waiting_for_response_reminder` to detect expiration and for emails
  model: ApplicationReminder,
  as: 'waiting_for_response_reminder'
}, {
  // DEV: We include `received_offer_reminder` to detect expiration and for emails
  model: ApplicationReminder,
  as: 'received_offer_reminder'
}];
