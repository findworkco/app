// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var HttpError = require('http-errors');
var Application = require('./application');
var Interview = require('./interview');
var Reminder = require('./reminder');
var applicationMockData = require('./application-mock-data');
var genericMockData = require('./generic-mock-data');

// Generate interviews map by ids
var interviewsById = {};
genericMockData.interviews.forEach(function saveInterviewById (interview) {
  interviewsById[interview.id] = interview;
});

// Define interview builder
var applicationMocks = genericMockData.applications;
var reminderMocks = genericMockData.reminders;
function buildInterview(attrs, include) {
  // Fallback our include parameter temporarily
  // TODO: Remove include fallback
  if (!include) {
    var _applicationAttrs = _.findWhere(applicationMocks, {id: attrs.application_id});
    include = [
      {
        model: Application, include: _.flatten([
          {model: Interview},
          _applicationAttrs.saved_for_later_reminder_id ?
            {model: Reminder, as: 'saved_for_later_reminder'} : [],
          _applicationAttrs.waiting_for_response_reminder_id ?
            {model: Reminder, as: 'waiting_for_response_reminder'} : [],
          _applicationAttrs.received_offer_reminder_id ?
            {model: Reminder, as: 'received_offer_reminder'} : []
        ])
      },
      {model: Reminder, as: 'pre_interview_reminder'},
      {model: Reminder, as: 'post_interview_reminder'}
    ];
  }

  // Compile our build data based on include
  var buildData = _.clone(attrs);
  if (include) {
    include.forEach(function handleIncludeItem (includeItem) {
      // Upcast models to objects
      if (includeItem.$modelOptions) {
        includeItem = {model: includeItem};
      }

      // If the include is an application, load include data from applicationMockData's resolver
      if (includeItem.model === Application) {
        assert(!includeItem.as, 'Received unexpected "as" key for Application');
        var applicationAttrs = applicationMockData._buildApplicationAttrs(
          _.findWhere(applicationMocks, {id: attrs.application_id}), includeItem.include);
        buildData.application = applicationAttrs;
      // If our include is a reminder, build the matching reminder type
      } else if (includeItem.model === Reminder) {
        assert(includeItem.as, 'Missing "as" parameter for Reminder include');
        if (includeItem.as === 'pre_interview_reminder') {
          buildData.pre_interview_reminder = _.findWhere(reminderMocks,
            {id: attrs.pre_interview_reminder_id});
        } else if (includeItem.as === 'post_interview_reminder') {
          buildData.post_interview_reminder = _.findWhere(reminderMocks,
            {id: attrs.post_interview_reminder_id});
        } else {
          throw new Error('Unrecognized "as" parameter for Reminder: "' + includeItem.as + '"');
        }
      // Otherwise, complain and leave
      } else {
        throw new Error('Unrecognized model type "' + includeItem.model + '"');
      }
    });
  }

  // Build and return our interview with its application (and its interviews) and reminders
  // http://docs.sequelizejs.com/en/v3/docs/associations/#creating-with-associations
  var retVal = Interview.build(buildData, {include: include});
  return retVal;
}

// Export interview mock data resolver
exports.getById = function (id) {
  return interviewsById.hasOwnProperty(id) ? buildInterview(interviewsById[id]) : null;
};
exports.getByIdOr404 = function (id, include) {
  // Resolve our interview
  var interview = exports.getById(id, include);

  // If the interview doesn't exist, then 404
  if (interview === null) {
    throw new HttpError.NotFound();
  }

  // Otherwise, return our interview
  return interview;
};
