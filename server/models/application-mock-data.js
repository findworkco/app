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
  // Find and save our application
  var retVal = {};
  retVal.selectedApplication = applicationsById[id];

  // Save application specific info
  retVal.glassdoorResult = {
    id: 12345,
    name: 'IBM',
    website: 'www.ibm.com',
    industry: null,
    overall_rating: '0.0/5.0 (20 ratings)',
    ceo_review: '0% approve, 0% disapprove (0 ratings)',
    glassdoor_url: 'http://glassdoor.com/ibm'
  };
  // Form: https://docs.google.com/a/findwork.co/forms/d/1b_pmseT_J0bG_9vK-CA7XGJTy-IOMDq0MvrXGREN4k8/edit
  // DEV: URL resolved by taking form from email and verifying that GET works as well as POST
  retVal.glassdoorResult.badMatchUrl = 'https://docs.google.com/' +
    'a/findwork.co/forms/d/1b_pmseT_J0bG_9vK-CA7XGJTy-IOMDq0MvrXGREN4k8/formResponse' +
    '?entry.1562009024=' + encodeURIComponent(retVal.company_name) +
    '&entry.978071742=' + encodeURIComponent(retVal.glassdoorResult.id);

  retVal.angelListResult = {
    id: 67890,
    name: 'AngelList',
    website: 'http://angel.co',
    followers: 2849,
    locations: 'San Francisco',
    markets: 'Startups, Venture Capital',
    angellist_url: 'http://angel.co/angellist'
  };
  // Form: https://docs.google.com/a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/edit
  retVal.angelListResult.badMatchUrl = 'https://docs.google.com/' +
    'a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/formResponse' +
    '?entry.1562009024=' + encodeURIComponent(retVal.company_name) +
    '&entry.978071742=' + encodeURIComponent(retVal.angelListResult.id);

  // Return our generated mock data
  return retVal;
};
