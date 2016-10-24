// Load in our dependencies
var _ = require('underscore');
var genericMockData = require('./generic-mock-data');

// Generate application map by ids
var applicationsById = {};
var applications = []
  .concat(_.pluck(genericMockData.upcomingInterviews, 'application'))
  .concat(genericMockData.waitingForResponseApplications)
  .concat(genericMockData.archivedApplications);
applications.forEach(function saveApplicationById (application) {
  applicationsById[application.id] = application;
});

// Export application mock data resolver
exports.getById = function (id) {
  // Find and return our application
  return {selectedApplication: applicationsById[id]};
};
