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
  // http://docs.sequelizejs.com/en/latest/docs/instances/#values-of-an-instance
  var retVal = Application.build(applicationAttributes).get({plain: true, clone: true});

  // Resolve and add on our past interviews
  var interviews = _.where(genericMockData.interviews, {
    application_id: applicationAttributes.id
  }).map(function buildInterview (interviewAttributes) {
    return Interview.build(interviewAttributes).get({plain: true, clone: true});
  });
  var now = new Date();
  retVal.past_interviews = interviews.filter(function isPastInterview (interview) {
    return interview.date_time_datetime < now;
  });
  retVal.upcoming_interviews = interviews.filter(function isUpcomingInterview (interview) {
    return interview.date_time_datetime >= now;
  });
  retVal.closest_upcoming_interview = retVal.upcoming_interviews[0];

  // Construct last contact moment
  // TODO: Resolve inside of `Application` model, maybe save as its own column for independent querying
  var pastInterviewMoments = _.pluck(retVal.past_interviews, 'date_time_moment');
  retVal.last_contact_moment = pastInterviewMoments.reduce(function findLatestInterview (momentA, momentB) {
    return momentA.isAfter(momentB) ? momentA : momentB;
  }, retVal.application_date_moment);

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
