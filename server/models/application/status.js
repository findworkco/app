// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var moment = require('moment-timezone');
var HttpError = require('http-errors');
var reminderUtils = require('../../utils/reminder');

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
  _createOrRemoveDefaultContent: function (candidate) {
    // DEV: This is a catch-all method to create default reminders for when shifting between statuses
    // DEV: We assert `candidate` upfront as it isn't always used but each update has potential to use it
    assert(candidate);
    var status = this.getDataValue('status');
    if (status === exports.STATUSES.SAVED_FOR_LATER) {
      // We don't know how to handle removal/preservation of application date so we ignore it
      throw new Error('Creating/removing default content for saved for later application is not supported');
    }

    // Backfill application date
    var retVal = [this];
    if (!this.get('application_date_moment')) {
      this.set('application_date_moment', moment());
    }

    // If we are an archived application, then fallback its archived at timestamp
    if (status === exports.STATUSES.ARCHIVED) {
      if (!this.get('archived_at_moment')) {
        this.set('archived_at_moment', moment());
      }
    // Otherwise, remove its archived at timestamp
    } else {
      this.set('archived_at_moment', null);
    }

    // If we are waiting for a response
    var reminder;
    if (status === exports.STATUSES.WAITING_FOR_RESPONSE) {
      // Fallback our default reminder
      if (!this.get('waiting_for_response_reminder_id')) {
        reminder = this.createWaitingForResponseReminder({
          is_enabled: true,
          date_time_moment: reminderUtils.getWaitingForResponseDefaultMoment(candidate.get('timezone'))
        });
        retVal.push(reminder);
      }
    // Otherwise, if we have an upcoming interview
    } else if (status === exports.STATUSES.UPCOMING_INTERVIEW) {
      // Do nothing
    } else if (status === exports.STATUSES.RECEIVED_OFFER) {
      // Fallback our default reminder
      if (!this.get('received_offer_reminder_id')) {
        reminder = this.createReceivedOfferReminder({
          is_enabled: true,
          date_time_moment: reminderUtils.getReceivedOfferDefaultMoment(candidate.get('timezone'))
        });
        retVal.push(reminder);
      }
    } else if (status === exports.STATUSES.ARCHIVED) {
      // Do nothing
    }

    // Return our created/updated models
    return retVal;
  },

  updateToApplied: function (candidate) {
    // If the application is "saved for later", then move it to "waiting for response"
    // DEV: Validation will ensure we have a `waiting_for_response` reminder set
    if (this.getDataValue('status') === exports.STATUSES.SAVED_FOR_LATER) {
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    // Otherwise, reject the change
    } else {
      throw new HttpError.BadRequest('Application has already been applied to');
    }

    // Create and return our default content
    return this._createOrRemoveDefaultContent(candidate);
  },
  updateToInterviewChanges: function (candidate) {
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

    // Create and return our default content
    return this._createOrRemoveDefaultContent(candidate);
  },
  updateToReceivedOffer: function (candidate) {
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

    // Create and return our default content
    return this._createOrRemoveDefaultContent(candidate);
  },
  updateToRemoveOffer: function (candidate) {
    // Verify we have upcoming interviews loaded AND waiting for response reminder
    var upcomingInterviews = this.get('upcoming_interviews');
    assert(upcomingInterviews, '`updateToInterviewChanges()` requires upcoming interviews are loaded');

    // If the application is not "received offer", then reject the change
    if (this.getDataValue('status') !== exports.STATUSES.RECEIVED_OFFER) {
      throw new HttpError.BadRequest('Application doesn\'t have an offer or is archived');
    }

    // If we have an upcoming interview, change status to "Upcoming interview"
    if (upcomingInterviews.length >= 1) {
      this.setDataValue('status', exports.STATUSES.UPCOMING_INTERVIEW);
    // Otherwise change status to "Waiting for response"
    } else {
      // DEV: We could support downgrading to "Saved for later" but it gets hairy with application date preservation
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    }

    // Create and return our default content
    return this._createOrRemoveDefaultContent(candidate);
  },
  updateToArchived: function (candidate) {
    // If the application is archivable, then archive it
    if ([exports.STATUSES.WAITING_FOR_RESPONSE, exports.STATUSES.UPCOMING_INTERVIEW, exports.STATUSES.RECEIVED_OFFER]
        .indexOf(this.getDataValue('status')) !== -1) {
      this.setDataValue('status', exports.STATUSES.ARCHIVED);
    // Otherwise, reject the change
    } else {
      throw new HttpError.BadRequest('Application is already archived or cannot be (e.g. saved for later)');
    }

    // Create and return our default content
    return this._createOrRemoveDefaultContent(candidate);
  },
  updateToRestore: function (candidate) {
    // Verify we have upcoming interviews loaded AND waiting for response reminder
    var upcomingInterviews = this.get('upcoming_interviews');
    assert(upcomingInterviews, '`updateToRestore()` requires upcoming interviews are loaded');

    // If the application is not archived, then reject the change
    if (this.getDataValue('status') !== exports.STATUSES.ARCHIVED) {
      throw new HttpError.BadRequest('Application is not archived');
    }

    // If the application had received an offer, then change status to "received offer"
    // DEV: This doesn't cover case of adding/removing offer then archiving
    //   but this is such an edge case that we are ignoring it for now
    if (this.get('received_offer_reminder_id')) {
      this.setDataValue('status', exports.STATUSES.RECEIVED_OFFER);
    // Otherwise, if we have an upcoming interview, then change status to "upcoming interview"
    } else if (upcomingInterviews.length >= 1) {
      this.setDataValue('status', exports.STATUSES.UPCOMING_INTERVIEW);
    // Otherwise, restore to "waiting for response"
    } else {
      // DEV: We can't have archived "saved for later" application due to restriction in `updateToArchived()`
      this.setDataValue('status', exports.STATUSES.WAITING_FOR_RESPONSE);
    }

    // Create and return our default content
    return this._createOrRemoveDefaultContent(candidate);
  }
};
