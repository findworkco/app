// Load in our dependencies
var _ = require('underscore');
var applicationMockData = require('./application-mock-data');
var layoutMockData = require('./layout-mock-data');

// Generate application map by ids
var interviewsById = {};
var interviews = []
  .concat(layoutMockData.upcomingInterviews)
  .concat(layoutMockData.waitingForResponseApplications[0].past_interviews);
interviews.forEach(function saveInterviewById (interview) {
  interviewsById[interview.id] = interview;
});

// Export application mock data resolver
exports.getById = function (id) {
  // Find and save our interview
  var retVal = _.clone(layoutMockData);
  retVal.selectedInterview = interviewsById[id];

  // Find and save our interview's application
  retVal.selectedApplication = applicationMockData.getById(retVal.selectedInterview.application_id).selectedApplication;

  // Return our generated mock data
  return retVal;
};
