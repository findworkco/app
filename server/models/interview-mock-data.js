// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Application = require('./application');
var Interview = require('./interview');
var InterviewReminder = require('./interview-reminder');
var applicationMockData = require('./application-mock-data');
var genericMockData = require('./generic-mock-data');

// Generate interviews map by ids
var interviewsById = {};
genericMockData.interviews.forEach(function saveInterviewById (interview) {
  interviewsById[interview.id] = interview;
});

// Define interview builder
var applicationMocks = genericMockData.applications;
var interviewReminderMocks = genericMockData.interviewReminders;
function buildInterview(attrs, options) {
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
  var buildData = _.clone(attrs);
  if (options.include) {
    options.include.forEach(function handleIncludeItem (includeItem) {
      // Upcast models to objects
      if (includeItem.$modelOptions) {
        includeItem = {model: includeItem};
      }

      // If the include is an application, load include data from applicationMockData's resolver
      if (includeItem.model === Application) {
        assert(!includeItem.as, 'Received unexpected "as" key for Application');
        var applicationAttrs = applicationMockData._buildApplicationAttrs(
          _.findWhere(applicationMocks, {id: attrs.application_id}), {include: includeItem.include});
        buildData.application = applicationAttrs;
      // If our include is a reminder, build the matching reminder type
      } else if (includeItem.model === InterviewReminder) {
        assert(includeItem.as, 'Missing "as" parameter for InterviewReminder include');
        if (includeItem.as === 'pre_interview_reminder') {
          buildData.pre_interview_reminder = _.findWhere(interviewReminderMocks,
            {id: attrs.pre_interview_reminder_id});
        } else if (includeItem.as === 'post_interview_reminder') {
          buildData.post_interview_reminder = _.findWhere(interviewReminderMocks,
            {id: attrs.post_interview_reminder_id});
        } else {
          throw new Error('Unrecognized "as" parameter for InterviewReminder: "' + includeItem.as + '"');
        }
      // Otherwise, complain and leave
      } else {
        throw new Error('Unrecognized model type "' + includeItem.model + '"');
      }
    });
  }

  // Build and return our interview with its application (and its interviews) and reminders
  // http://docs.sequelizejs.com/en/v3/docs/associations/#creating-with-associations
  var retVal = Interview.build(buildData, options);
  return retVal;
}

// Export interview mock data resolver
exports.getById = function (id, options) {
  return interviewsById.hasOwnProperty(id) ? buildInterview(interviewsById[id], options) : null;
};
