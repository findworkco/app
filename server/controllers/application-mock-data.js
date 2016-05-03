// Load in our dependencies
var _ = require('underscore');
var layoutMockData = require('./layout-mock-data');

// Export our new mock data
_.extend(exports, layoutMockData);
exports.selectedApplication = layoutMockData.waitingForResponseApplications[0];
exports.glassdoorResult = {
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
// jscs:disable maximumLineLength
exports.glassdoorResult.badMatchUrl = 'https://docs.google.com/a/findwork.co/forms/d/1b_pmseT_J0bG_9vK-CA7XGJTy-IOMDq0MvrXGREN4k8/formResponse?entry.1562009024=' + encodeURIComponent(exports.selectedApplication.company_name) + '&entry.978071742=' + encodeURIComponent(exports.glassdoorResult.id);
// jscs:enable maximumLineLength

exports.angelListResult = {
  id: 67890,
  name: 'AngelList',
  website: 'http://angel.co',
  followers: 2849,
  locations: 'San Francisco',
  markets: 'Startups, Venture Capital',
  angellist_url: 'http://angel.co/angellist'
};
// Form: https://docs.google.com/a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/edit
// jscs:disable maximumLineLength
exports.angelListResult.badMatchUrl = 'https://docs.google.com/a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/formResponse?entry.1562009024=' + encodeURIComponent(exports.selectedApplication.company_name) + '&entry.978071742=' + encodeURIComponent(exports.angelListResult.id);
// jscs:enable maximumLineLength
