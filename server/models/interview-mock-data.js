// Load in our dependencies
var assert = require('assert');
var HttpError = require('http-errors');
var Interview = require('./interview');
var applicationMockData = require('./application-mock-data');
var genericMockData = require('./generic-mock-data');
var reminderMockData = require('./reminder-mock-data');

// Generate interviews map by ids
var interviewsById = {};
genericMockData.interviews.forEach(function saveInterviewById (interview) {
  interviewsById[interview.id] = interview;
});

// Define interview builder
function buildInterview(interviewAttributes) {
  // Build our interview
  // http://docs.sequelizejs.com/en/latest/docs/instances/#values-of-an-instance
  var retVal = Interview.build(interviewAttributes).get({plain: true, clone: true});

  // Resolve our application by its id
  // DEV: We use `getById` so we have full data for recently viewed applications
  retVal.application = applicationMockData.getById(interviewAttributes.application_id);
  assert(retVal.application, 'Expected `interview.application_id` "' + interviewAttributes.application_id + '" ' +
    'to match an application but it didn\'t');

  // Resolve and build our reminders
  retVal.pre_interview_reminder = reminderMockData.getById(interviewAttributes.pre_interview_reminder_id);
  retVal.post_interview_reminder = reminderMockData.getById(interviewAttributes.post_interview_reminder_id);

  // Return our retVal
  return retVal;
}

// Export interview mock data resolver
exports.getById = function (id) {
  return interviewsById.hasOwnProperty(id) ? buildInterview(interviewsById[id]) : null;
};
exports.getByIdOr404 = function (id) {
  // Resolve our interview
  var interview = exports.getById(id);

  // If the interview doesn't exist, then 404
  if (interview === null) {
    throw new HttpError.NotFound();
  }

  // Otherwise, return our interview
  return interview;
};
