// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
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
exports._buildApplicationAttrs = function (attrs, options) {
  // Clone our attrs for extension
  var retVal = _.clone(attrs);

  // If we have an include parameter
  if (options.include) {
    options.include.forEach(function handleIncludeItem (includeItem) {
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
function buildApplication(attrs, options) {
  // If we have an include parameter, clone it by 2 levels to prevent mutation on `build`
  options = _.clone(options) || {};
  function cloneInclude(options) {
    if (options.include) {
      options.include = options.include.map(function cloneIncludeItem (includeItem) {
        // Clone our include item
        includeItem = _.clone(includeItem);

        // If the include item has an include, then recurse it
        if (includeItem.include) {
          cloneInclude(includeItem);
        }

        // Return our cloned include item
        return includeItem;
      });
    }
  }
  cloneInclude(options);

  // Compile our build data based on include
  var buildData = exports._buildApplicationAttrs(attrs, options);

  // Build and return our application
  var retVal = Application.build(buildData, options);
  return retVal;
}

// Export application mock data resolver
exports.getById = function (id, options) {
  return applicationsById.hasOwnProperty(id) ? buildApplication(applicationsById[id], options) : null;
};
exports.getReceivedOfferApplications = function (options) {
  return _.where(genericMockData.applications, {
    status: Application.STATUSES.RECEIVED_OFFER
  }).map(function (attrs) { return buildApplication(attrs, options); });
};
exports.getUpcomingInterviewApplications = function (options) {
  return _.where(genericMockData.applications, {
    status: Application.STATUSES.UPCOMING_INTERVIEW
  }).map(function (attrs) { return buildApplication(attrs, options); });
};
exports.getWaitingForResponseApplications = function (options) {
  return _.where(genericMockData.applications, {
    status: Application.STATUSES.WAITING_FOR_RESPONSE
  }).map(function (attrs) { return buildApplication(attrs, options); });
};
exports.getSavedForLaterApplications = function (options) {
  return _.where(genericMockData.applications, {
    status: Application.STATUSES.SAVED_FOR_LATER
  }).map(function (attrs) { return buildApplication(attrs, options); });
};
exports.getArchivedApplications = function (options) {
  return _.where(genericMockData.applications, {
    status: Application.STATUSES.ARCHIVED
  }).map(function (attrs) { return buildApplication(attrs, options); });
};
