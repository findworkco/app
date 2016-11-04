// Load in our dependencies
var _ = require('underscore');
var Application = require('./application');
var Interview = require('./interview');
var genericMockData = require('./generic-mock-data');

// Generate application map by ids
var applicationsById = {};
genericMockData.applications.forEach(function saveApplicationById (application) {
  applicationsById[application.id] = application;
});

// Define application builder
function buildApplication(applicationAttributes) {
  // Build our application
  var retVal = Application.build(applicationAttributes).get({plain: true, clone: true});

  // Resolve and add on our past interviews
  var pastInterviews = _.where(genericMockData.interviews, {
    application_id: applicationAttributes.id
  }).map(function buildInterview (interviewAttributes) {
    return Interview.build(interviewAttributes).get({plain: true, clone: true});
  });
  retVal.past_interviews = pastInterviews;

  // Return our retVal
  return retVal;
}

// Export application mock data resolver
exports.getById = function (id) {
  return applicationsById.hasOwnProperty(id) ? buildApplication(applicationsById[id]) : null;
};
exports.getWaitingForResponseApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.WAITING_FOR_RESPONSE
  }).map(buildApplication);
};
exports.getArchivedApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.ARCHIVED
  }).map(buildApplication);
};
