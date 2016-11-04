// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var moment = require('moment-timezone');
var Application = require('./application');
var Interview = require('./interview');
var genericMockData = require('./generic-mock-data');

// Generate interviews map by ids
var interviewsById = {};
genericMockData.interviews.forEach(function saveInterviewById (interview) {
  interviewsById[interview.id] = interview;
});

// Define interview builder
function buildInterview(interviewAttributes) {
  // Build our interview
  var retVal = Interview.build(interviewAttributes).get({plain: true, clone: true});

  // Resolve our application by its id
  var applicationAttributes = _.findWhere(genericMockData.applications, {
    id: interviewAttributes.application_id
  });
  assert(applicationAttributes, 'Expected `interview.application_id` "' + interviewAttributes.application_id + '" ' +
    'to match an application but it didn\'t');
  retVal.application = Application.build(applicationAttributes).get({plain: true, clone: true});

  // Return our retVal
  return retVal;
}

// Export interview mock data resolver
exports.getById = function (id) {
  return interviewsById.hasOwnProperty(id) ? buildInterview(interviewsById[id]) : null;
};
exports.getUpcomingInterviews = function () {
  // Construct our interviews so we can access `moment` attributes consistently
  var interviews = genericMockData.interviews.map(buildInterview);

  // Find upcoming interviews
  var now = moment();
  var upcomingInterviews = interviews.filter(function filterUpcomingInterviews (interview) {
    return interview.date_time_moment.isAfter(now);
  });

  // Return our upcoming interviews
  return upcomingInterviews;
};
