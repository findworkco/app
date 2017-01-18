// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var HttpError = require('http-errors');

// Define constants for our applications
exports.STATUSES = {
  SAVED_FOR_LATER: 'saved_for_later',
  WAITING_FOR_RESPONSE: 'waiting_for_response',
  UPCOMING_INTERVIEW: 'upcoming_interview',
  RECEIVED_OFFER: 'received_offer',
  ARCHIVED: 'archived'
};
exports.ADD_HUMAN_STATUSES = {
  SAVED_FOR_LATER: 'Saving for later',
  WAITING_FOR_RESPONSE: 'Waiting for response',
  UPCOMING_INTERVIEW: 'Upcoming interview',
  RECEIVED_OFFER: 'Received offer'
};
exports.EDIT_HUMAN_STATUSES = _.defaults({
  SAVED_FOR_LATER: 'Saved for later',
  ARCHIVED: 'Archived'
}, exports.ADD_HUMAN_STATUSES);

// Define instance methods for status
// DEV: These are quite bulky so we offload them to another file
// DEV: We intentionally keep these long/stupid to avoid edge cases from being clever
exports.instanceMethods = {
  updateToApplied: function () {
    // If the application is "saved for later", then move it to "waiting for response"
    // DEV: Validation will ensure we have a `waiting_for_response` reminder set
    if (this.getDataValue('status') === exports.STATUSES.SAVED_FOR_LATER) {
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    // Otherwise, reject the change
    } else {
      throw new HttpError.BadRequest('Application has already been applied to');
    }
  },
  updateToInterviewChanges: function () {
    // Verify we have upcoming interviews loaded
    var upcomingInterviews = this.get('upcoming_interviews');
    assert(upcomingInterviews, '`updateToInterviewChanges()` requires upcoming interviews are loaded');

    // If the application isn't in an interview sensitive status, then do nothing
    //   Upcoming interview is sensitive due to interview changing to past or deletion
    var interviewSensitiveStatuses = [
      exports.STATUSES.SAVED_FOR_LATER, exports.STATUSES.WAITING_FOR_RESPONSE, exports.STATUSES.UPCOMING_INTERVIEW];
    if (interviewSensitiveStatuses.indexOf(this.getDataValue('status')) === -1) {
      return;
    }

    // Otherwise, if we have an upcoming interview, change status to "Upcoming interview"
    if (upcomingInterviews.length >= 1) {
      this.setDataValue('status', exports.STATUSES.UPCOMING_INTERVIEW);
    // Otherwise, set status to "Waiting for response"
    } else {
      // DEV: In saved for later case, they can only add interview so this is a past one which means they've applied
      // DEV: Validation will ensure we have a `waiting_for_response` reminder set
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    }
  },
  updateToReceivedOffer: function () {
    // If the application is before "received offer", then move it to "received offer"
    // DEV: Validation will ensure we have a `received_offer` reminder set
    // DEV: We could blacklist `RECEIVED_OFFER` and `ARCHIVED` but whitelist will cause less issues
    if ([exports.STATUSES.SAVED_FOR_LATER, exports.STATUSES.WAITING_FOR_RESPONSE, exports.STATUSES.UPCOMING_INTERVIEW]
        .indexOf(this.getDataValue('status')) !== -1) {
      this.setDataValue('status', exports.STATUSES.RECEIVED_OFFER);
    // Otherwise, reject the change
    } else {
      throw new HttpError.BadRequest('Application has already received an offer or is archived');
    }
  },
  updateToRemoveOffer: function () {
    // Verify we have upcoming interviews loaded AND waiting for response reminder
    var upcomingInterviews = this.get('upcoming_interviews');
    assert(upcomingInterviews, '`updateToInterviewChanges()` requires upcoming interviews are loaded');
    assert(_.findWhere(this.$options.include, {as: 'waiting_for_response_reminder'}),
      '`updateToInterviewChanges()` requires `waiting_for_response` reminder is included');

    // If the application is not "received offer", then reject the change
    if (this.getDataValue('status') !== exports.STATUSES.RECEIVED_OFFER) {
      throw new HttpError.BadRequest('Application doesn\'t have an offer or is archived');
    }

    // If we have an upcoming interview, change status to "Upcoming interview"
    if (upcomingInterviews.length >= 1) {
      this.setDataValue('status', exports.STATUSES.UPCOMING_INTERVIEW);
    // Otherwise, if we were previously waiting for response, change status to "Waiting for response"
    } else if (this.get('waiting_for_response_reminder')) {
      // DEV: This is a little janky by looking at reminder itself but it's simplest without adding another column
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    // Otherwise, assume we were saved for later
    } else {
      this.setDataValue('status', exports.STATUSES.SAVED_FOR_LATER);
    }
  },
  updateToArchived: function () {
    // If the application is archivable, then archive it
    if ([exports.STATUSES.WAITING_FOR_RESPONSE, exports.STATUSES.UPCOMING_INTERVIEW, exports.STATUSES.RECEIVED_OFFER]
        .indexOf(this.getDataValue('status')) !== -1) {
      this.setDataValue('status', exports.STATUSES.ARCHIVED);
    // Otherwise, reject the change
    } else {
      throw new HttpError.BadRequest('Application is already archived or cannot be (e.g. saved for later)');
    }
  },
  updateToRestore: function () {
    // Verify we have upcoming interviews loaded AND waiting for response reminder
    var upcomingInterviews = this.get('upcoming_interviews');
    assert(upcomingInterviews, '`updateToInterviewChanges()` requires upcoming interviews are loaded');
    assert(_.findWhere(this.$options.include, {as: 'received_offer_reminder'}),
      '`updateToInterviewChanges()` requires `received_offer` reminder is included');

    // If the application is not archived, then reject the change
    if (this.getDataValue('status') !== exports.STATUSES.ARCHIVED) {
      throw new HttpError.BadRequest('Application is not archived');
    }

    // If the application had received an offer, then change status to "received offer"
    // DEV: This doesn't cover case of adding/removing offer then archiving
    //   but this is such an edge case that we are ignoring it for now
    if (this.get('received_offer_reminder')) {
      this.setDataValue('status', exports.STATUSES.RECEIVED_OFFER);
    // Otherwise, if we have an upcoming interview, then change status to "upcoming interview"
    } else if (upcomingInterviews.length >= 1) {
      this.setDataValue('status', exports.STATUSES.UPCOMING_INTERVIEW);
    // Otherwise, restore to "waiting for response"
    } else {
      // DEV: We can't have archived "saved for later" application due to restriction in `updateToArchived()`
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    }
  }
};
