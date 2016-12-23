// Load in our dependencies
var _ = require('underscore');
var HttpError = require('http-errors');
var Application = require('./application');
var Interview = require('./interview');
var Reminder = require('./reminder');
var genericMockData = require('./generic-mock-data');

// Generate application map by ids
var applicationsById = {};
genericMockData.applications.forEach(function saveApplicationById (application) {
  applicationsById[application.id] = application;
});

// Define application builder
// http://docs.sequelizejs.com/en/v3/docs/associations/#creating-with-associations
var interviewMocks = genericMockData.interviews;
var reminderMocks = genericMockData.reminders;
exports._buildApplicationAttrs = function (attrs) {
  return _.extend({}, attrs, {
    interviews: _.where(interviewMocks, {application_id: attrs.id}),
    saved_for_later_reminder: _.findWhere(reminderMocks, {id: attrs.saved_for_later_reminder_id}),
    waiting_for_response_reminder: _.findWhere(reminderMocks, {id: attrs.waiting_for_response_reminder_id}),
    received_offer_reminder: _.findWhere(reminderMocks, {id: attrs.received_offer_reminder_id})
  });
};
exports._buildApplicationInclude = function (attrs) {
  // DEV: We use `_.flatten` and empty arrays to skip non-included data
  return _.flatten([
    {model: Interview},
    attrs.saved_for_later_reminder_id ? {model: Reminder, as: 'saved_for_later_reminder'} : [],
    attrs.waiting_for_response_reminder_id ? {model: Reminder, as: 'waiting_for_response_reminder'} : [],
    attrs.received_offer_reminder_id ? {model: Reminder, as: 'received_offer_reminder'} : []
  ]);
};
function buildApplication(attrs) {
  // Build our application
  var retVal = Application.build(exports._buildApplicationAttrs(attrs), {
    include: exports._buildApplicationInclude(attrs)
  }).get({plain: true});

  // Return our retVal
  return retVal;
}

// Export application mock data resolver
exports.getById = function (id) {
  return applicationsById.hasOwnProperty(id) ? buildApplication(applicationsById[id]) : null;
};
exports.getByIdOr404 = function (id) {
  // Resolve our application
  var application = exports.getById(id);

  // If the application doesn't exist, then 404
  if (application === null) {
    throw new HttpError.NotFound();
  }

  // Otherwise, return our application
  return application;
};
exports.getReceivedOfferApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.RECEIVED_OFFER
  }).map(buildApplication);
};
exports.getUpcomingInterviewApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.UPCOMING_INTERVIEW
  }).map(buildApplication);
};
exports.getWaitingForResponseApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.WAITING_FOR_RESPONSE
  }).map(buildApplication);
};
exports.getSavedForLaterApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.SAVED_FOR_LATER
  }).map(buildApplication);
};
exports.getArchivedApplications = function () {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.ARCHIVED
  }).map(buildApplication);
};
