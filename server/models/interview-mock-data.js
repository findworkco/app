// Load in our dependencies
var _ = require('underscore');
var HttpError = require('http-errors');
var Application = require('./application');
var Interview = require('./interview');
var Reminder = require('./reminder');
var applicationMockData = require('./application-mock-data');
var genericMockData = require('./generic-mock-data');

// Generate interviews map by ids
var interviewsById = {};
genericMockData.interviews.forEach(function saveInterviewById (interview) {
  interviewsById[interview.id] = interview;
});

// Define interview builder
var applicationMocks = genericMockData.applications;
var reminderMocks = genericMockData.reminders;
function buildInterview(attrs) {
  // Build our interview with its application (and its interviews) and reminders
  // http://docs.sequelizejs.com/en/v3/docs/associations/#creating-with-associations
  var applicationAttrs = applicationMockData._buildApplicationAttrs(
    _.findWhere(applicationMocks, {id: attrs.application_id}));
  var retVal = Interview.build(_.extend({}, attrs, {
    application: applicationAttrs,
    pre_interview_reminder: _.findWhere(reminderMocks, {id: attrs.pre_interview_reminder_id}),
    post_interview_reminder: _.findWhere(reminderMocks, {id: attrs.post_interview_reminder_id})
  }), {
    // TODO: Relocate include calls to controllers
    include: [
      {model: Application, include: applicationMockData._buildApplicationInclude(applicationAttrs)},
      {model: Reminder, as: 'pre_interview_reminder'},
      {model: Reminder, as: 'post_interview_reminder'}
    ]
  }).get({plain: true});

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
