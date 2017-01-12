// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Application = require('./application');
var Interview = require('./interview');
var ApplicationReminder = require('./application-reminder');
var genericMockData = require('./generic-mock-data');

// Generate application map by ids
var applicationsById = {};
genericMockData.applications.forEach(function saveApplicationById (application) {
  applicationsById[application.id] = application;
});

// Define application builder
// http://docs.sequelizejs.com/en/v3/docs/associations/#creating-with-associations
var interviewMocks = genericMockData.interviews;
var applicationReminderMocks = genericMockData.applicationReminders;
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
      } else if (includeItem.model === ApplicationReminder) {
        assert(includeItem.as, 'Missing "as" parameter for ApplicationReminder include');
        if (includeItem.as === 'saved_for_later_reminder') {
          retVal.saved_for_later_reminder = _.findWhere(applicationReminderMocks,
            {id: attrs.saved_for_later_reminder_id});
        } else if (includeItem.as === 'waiting_for_response_reminder') {
          retVal.waiting_for_response_reminder = _.findWhere(applicationReminderMocks,
            {id: attrs.waiting_for_response_reminder_id});
        } else if (includeItem.as === 'received_offer_reminder') {
          retVal.received_offer_reminder = _.findWhere(applicationReminderMocks,
            {id: attrs.received_offer_reminder_id});
        } else {
          throw new Error('Unrecognized "as" parameter for ApplicationReminder: "' + includeItem.as + '"');
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
exports.getByIds = function (ids, options) {
  return ids.map(function getByIdsFn (id) {
    return exports.getById(id, options);
  });
};
