// Load in our dependencies
var assert = require('assert');
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
exports._buildApplicationAttrs = function (attrs, include) {
  // Clone our attrs for extension
  var retVal = _.clone(attrs);

  // If we have an include parameter
  if (include) {
    include.forEach(function handleIncludeItem (includeItem) {
      // Upcast models to objects
      if (includeItem.$modelOptions) {
        includeItem = {model: includeItem};
      }

      // If the include is an interview, build its matching info
      if (includeItem.model === Interview) {
        assert(!includeItem.as, 'Received unexpected "as" key for Interview');
        retVal.interviews = _.where(interviewMocks, {application_id: attrs.id});
      // If the include is a reminder , build the matching reminder type
      } else if (includeItem.model === Reminder) {
        assert(includeItem.as, 'Missing "as" parameter for Reminder include');
        if (includeItem.as === 'saved_for_later_reminder') {
          retVal.saved_for_later_reminder = _.findWhere(reminderMocks,
            {id: attrs.saved_for_later_reminder_id});
        } else if (includeItem.as === 'waiting_for_response_reminder') {
          retVal.waiting_for_response_reminder = _.findWhere(reminderMocks,
            {id: attrs.waiting_for_response_reminder_id});
        } else if (includeItem.as === 'received_offer_reminder') {
          retVal.received_offer_reminder = _.findWhere(reminderMocks,
            {id: attrs.received_offer_reminder_id});
        } else {
          throw new Error('Unrecognized "as" parameter for Reminder: "' + includeItem.as + '"');
        }
      // Otherwise, complain and leave
      } else {
        throw new Error('Unrecognized model type "' + includeItem.model + '"');
      }
    });
  }

  // Return our retVal
  return retVal;
};
function buildApplication(attrs, include) {
  // Fallback our include parameter temporarily
  // TODO: Remove include fallback
  if (!include) {
    // DEV: We use `_.flatten` and empty arrays to skip non-included data
    include =  _.flatten([
      {model: Interview},
      attrs.saved_for_later_reminder_id ? {model: Reminder, as: 'saved_for_later_reminder'} : [],
      attrs.waiting_for_response_reminder_id ? {model: Reminder, as: 'waiting_for_response_reminder'} : [],
      attrs.received_offer_reminder_id ? {model: Reminder, as: 'received_offer_reminder'} : []
    ]);
  }

  // Compile our build data based on include
  var buildData = exports._buildApplicationAttrs(attrs, include);

  // Build and return our application
  var retVal = Application.build(buildData, {include: include});
  return retVal;
}

// Export application mock data resolver
exports.getById = function (id) {
  return applicationsById.hasOwnProperty(id) ? buildApplication(applicationsById[id]) : null;
};
exports.getByIdOr404 = function (id, include) {
  // Resolve our application
  var application = exports.getById(id, include);

  // If the application doesn't exist, then 404
  if (application === null) {
    throw new HttpError.NotFound();
  }

  // Otherwise, return our application
  return application;
};
exports.getReceivedOfferApplications = function (include) {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.RECEIVED_OFFER
  }).map(function (attrs) { return buildApplication(attrs, include); });
};
exports.getUpcomingInterviewApplications = function (include) {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.UPCOMING_INTERVIEW
  }).map(function (attrs) { return buildApplication(attrs, include); });
};
exports.getWaitingForResponseApplications = function (include) {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.WAITING_FOR_RESPONSE
  }).map(function (attrs) { return buildApplication(attrs, include); });
};
exports.getSavedForLaterApplications = function (include) {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.SAVED_FOR_LATER
  }).map(function (attrs) { return buildApplication(attrs, include); });
};
exports.getArchivedApplications = function (include) {
  return _.where(genericMockData.applications, {
    status: Application.APPLICATION_STATUSES.ARCHIVED
  }).map(function (attrs) { return buildApplication(attrs, include); });
};
