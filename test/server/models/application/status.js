// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var extractValues = require('extract-values');
var moment = require('moment-timezone');
var HttpError = require('http-errors');
var dateUtils = require('../../utils/date');
var dbFixtures = require('../../utils/db-fixtures');
var sinonUtils = require('../../../utils/sinon');
var Application = require('../../../../server/models/application');
var ApplicationReminder = require('../../../../server/models/application-reminder');
var Interview = require('../../../../server/models/interview');

// Define test helpers
function reloadApplication(key) {
  before(function reloadApplicationFn (done) {
    var application = this.models[key];
    application.reload({
      include: [{
        model: Interview
      }, {
        model: ApplicationReminder,
        as: 'saved_for_later_reminder'
      }, {
        model: ApplicationReminder,
        as: 'waiting_for_response_reminder'
      }, {
        model: ApplicationReminder,
        as: 'received_offer_reminder'
      }]
    }).asCallback(done);
  });
}

// Start our tests
// Direct status
scenario.model('A new Application model', function () {
  it('can set status directly', function () {
    var application = Application.build({});
    expect(function setApplicationStatus () {
      application.set('status', Application.STATUSES.SAVED_FOR_LATER);
    }).to.not.throw(Error);
  });
});

scenario.model('An existing Application model', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('cannot set status directly', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(function setApplicationStatus () {
      application.set('status', Application.STATUSES.WAITING_FOR_RESPONSE);
    }).to.throw(Error, /cannot be set directly/);
  });
});

// ACTION: Applied
// Saved for later -> Waiting for response
scenario.model('A "saved for later Application model" being applied to', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.spy(Application.Instance.prototype, '_touchActiveReminder');
  sinonUtils.spy(Application.Instance.prototype, '_createOrRemoveDefaultContent');
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);

  it('updates status to "Waiting for response" and creates default content', function () {
    // Assert status
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    var updatedModels = application.updateToApplied(candidate);
    expect(application.get('status')).to.equal('waiting_for_response');

    // Assert default content
    expect(updatedModels).to.be.an('array');
    var _touchActiveReminderSpy = Application.Instance.prototype._touchActiveReminder;
    expect(_touchActiveReminderSpy.callCount).to.equal(1);
    var _createOrRemoveDefaultContentSpy = Application.Instance.prototype._createOrRemoveDefaultContent;
    expect(_createOrRemoveDefaultContentSpy.callCount).to.equal(1);
  });
});

// Waiting for response, upcoming interview, received offer, archived -> Reject
scenario.model('A "non-saved for later Application model" being applied to', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);

  it('rejects the change', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(function () {
      application.updateToApplied(candidate);
    }).to.throw(HttpError.BadRequest, /already been applied to/);
  });
});

// ACTION: Added/updated/removed interview
// Received offer, archived -> Same/ignore
scenario.model('An "interview-insensitive Application model" handling interview addition/update/removal', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);

  it('doesn\'t affect its status', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToInterviewChanges(candidate);
    expect(application.get('status')).to.equal('received_offer');
  });
});

// Saved for later, waiting for response, upcoming interview
//   + upcoming interview -> Upcoming interview
scenario.model('An "interview-sensitive Application model with an upcoming interview" ' +
    'handling interview addition/update/removal', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY);
  before(function addUpcomingInterview () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var interview = Interview.build({date_time_moment: moment().add({weeks: 1}).tz('UTC')});
    application.setDataValue('interviews', [interview]);
  });
  sinonUtils.spy(Application.Instance.prototype, '_touchActiveReminder');
  sinonUtils.spy(Application.Instance.prototype, '_createOrRemoveDefaultContent');

  it('updates its status to "upcoming interview" and creates default content', function () {
    // Assert status
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var updatedModels = application.updateToInterviewChanges(candidate);
    expect(application.get('status')).to.equal('upcoming_interview');

    // Assert default content
    expect(updatedModels).to.be.an('array');
    var _touchActiveReminderSpy = Application.Instance.prototype._touchActiveReminder;
    expect(_touchActiveReminderSpy.callCount).to.equal(1);
    var _createOrRemoveDefaultContentSpy = Application.Instance.prototype._createOrRemoveDefaultContent;
    expect(_createOrRemoveDefaultContentSpy.callCount).to.equal(1);
  });
});

// Saved for later, waiting for response, upcoming interview
//   + no upcoming interview -> Waiting for response
scenario.model('An "interview-sensitive Application model with no upcoming interviews" ' +
    'handling interview addition/update/removal', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);
  before(function addPastInterview () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    var interview = Interview.build({date_time_moment: moment().subtract({weeks: 1}).tz('UTC')});
    application.setDataValue('interviews', [interview]);
  });

  // DEV: In saved for later case, this would be "Saved for later" getting a past interview which means they've applied
  it('updates its status to "waiting for response"', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    application.updateToInterviewChanges(candidate);
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// ACTION: Received offer
// Saved for later, waiting for response, upcoming interview -> Received offer
scenario.model('An "offer-tolerant Application model" receiving an offer', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY);
  sinonUtils.spy(Application.Instance.prototype, '_touchActiveReminder');
  sinonUtils.spy(Application.Instance.prototype, '_createOrRemoveDefaultContent');

  it('updates status to "Received offer" and created default content', function () {
    // Assert status
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    var updatedModels = application.updateToReceivedOffer(candidate);
    expect(application.get('status')).to.equal('received_offer');

    // Assert default content
    expect(updatedModels).to.be.an('array');
    var _touchActiveReminderSpy = Application.Instance.prototype._touchActiveReminder;
    expect(_touchActiveReminderSpy.callCount).to.equal(1);
    var _createOrRemoveDefaultContentSpy = Application.Instance.prototype._createOrRemoveDefaultContent;
    expect(_createOrRemoveDefaultContentSpy.callCount).to.equal(1);
  });
});

// Received offer, archived -> Reject
scenario.model('An "offer-intolerant Application model" receiving an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);

  it('rejects the change', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(function () {
      application.updateToReceivedOffer(candidate);
    }).to.throw(HttpError.BadRequest, /already received an offer or is archived/);
  });
});

// ACTION: Remove offer
// Received offer + upcoming interview -> Upcoming interview
scenario.model('A "received offer Application model with an upcoming interview" removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);
  before(function addUpcomingInterview () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var interview = Interview.build({date_time_moment: moment().add({weeks: 1}).tz('UTC')});
    application.setDataValue('interviews', [interview]);
  });
  sinonUtils.spy(Application.Instance.prototype, '_touchActiveReminder');
  sinonUtils.spy(Application.Instance.prototype, '_createOrRemoveDefaultContent');

  it('changes status to "upcoming interview" and creates default content', function () {
    // Assert status
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var updatedModels = application.updateToRemoveOffer(candidate);
    expect(application.get('status')).to.equal('upcoming_interview');

    // Assert default content
    expect(updatedModels).to.be.an('array');
    var _touchActiveReminderSpy = Application.Instance.prototype._touchActiveReminder;
    expect(_touchActiveReminderSpy.callCount).to.equal(1);
    var _createOrRemoveDefaultContentSpy = Application.Instance.prototype._createOrRemoveDefaultContent;
    expect(_createOrRemoveDefaultContentSpy.callCount).to.equal(1);
  });
});

// Received offer + no upcoming interview + was waiting for response -> Waiting for response
scenario.model('A "received offer Application model ' +
    'with no upcoming interview and previous "waiting for response" state" removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);
  before(function addWaitingForResponseReminder () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.set('waiting_for_response_reminder_id', 'mock-reminder-id');
  });

  it('changes status to "waiting for response"', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToRemoveOffer(candidate);
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Received offer + no upcoming interview + never waiting for response -> Waiting for response
// DEV: We could move to "Saved for later" but it causes more complication in code than it's worth =/
scenario.model('A "received offer Application model ' +
    'with no upcoming interview and no previous "waiting for response" state" removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);
  before(function removeWaitingForResponseReminder () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.set('waiting_for_response_reminder', null);
  });

  it('changes status to "waiting for response"', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToRemoveOffer(candidate);
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Saved for later, waiting for response, upcoming interview, archived -> Reject
scenario.model('A "non-received offer Application model" removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY);

  it('rejects the change', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    expect(function () {
      application.updateToRemoveOffer(candidate);
    }).to.throw(HttpError.BadRequest, /doesn\'t have an offer or is archived/);
  });
});

// ACTION: Archive
// Waiting for response, upcoming interview, received offer -> Archived
scenario.model('A "non-archived non-saved for later Application model" being archived', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY);
  sinonUtils.spy(Application.Instance.prototype, '_touchActiveReminder');
  sinonUtils.spy(Application.Instance.prototype, '_createOrRemoveDefaultContent');

  it('updates status to "Archived" and creates default content', function () {
    // Assert status
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    var updatedModels = application.updateToArchived(candidate);
    expect(application.get('status')).to.equal('archived');

    // Assert default content
    expect(updatedModels).to.be.an('array');
    var _touchActiveReminderSpy = Application.Instance.prototype._touchActiveReminder;
    expect(_touchActiveReminderSpy.callCount).to.equal(1);
    var _createOrRemoveDefaultContentSpy = Application.Instance.prototype._createOrRemoveDefaultContent;
    expect(_createOrRemoveDefaultContentSpy.callCount).to.equal(1);
  });
});

// Saved for later -> Reject
scenario.model('A "saved for later Application model" being archived', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);

  it('rejects the change', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(function () {
      application.updateToArchived(candidate);
    }).to.throw(HttpError.BadRequest, /is already archived or cannot be/);
  });
});

// Archived -> Reject
scenario.model('An "archived Application model" being archived', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);

  it('rejects the change', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    expect(function () {
      application.updateToArchived(candidate);
    }).to.throw(HttpError.BadRequest, /is already archived or cannot be/);
  });
});

// ACTION: Restore
// Archived + received offer reminder -> received offer
scenario.model('An "archived Application model that had received an offer" being restored', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);
  before(function addReceivedOfferReminder () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.set('received_offer_reminder_id', 'mock-reminder-id');
  });
  sinonUtils.spy(Application.Instance.prototype, '_touchActiveReminder');
  sinonUtils.spy(Application.Instance.prototype, '_createOrRemoveDefaultContent');

  it('changes status to "received offer"', function () {
    // Assert status
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    var updatedModels = application.updateToRestore(candidate);
    expect(application.get('status')).to.equal('received_offer');

    // Assert default content
    expect(updatedModels).to.be.an('array');
    var _touchActiveReminderSpy = Application.Instance.prototype._touchActiveReminder;
    expect(_touchActiveReminderSpy.callCount).to.equal(1);
    var _createOrRemoveDefaultContentSpy = Application.Instance.prototype._createOrRemoveDefaultContent;
    expect(_createOrRemoveDefaultContentSpy.callCount).to.equal(1);
  });
});

// Archived + upcoming interview -> upcoming interview
scenario.model('An "archived Application model with no offer but with upcoming interview" being restored', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);
  before(function removeReminderAndAddUpcomingInterview () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.set('received_offer_reminder', null);
    var interview = Interview.build({date_time_moment: moment().add({weeks: 1}).tz('UTC')});
    application.setDataValue('interviews', [interview]);
  });

  it('changes status to "upcoming interview"', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.updateToRestore(candidate);
    expect(application.get('status')).to.equal('upcoming_interview');
  });
});

// Archived + no upcoming interview -> waiting for response
scenario.model('An "archived Application model with no offer and no upcoming interview" being restored', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);
  before(function removeReminderAndInterviews () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.set('received_offer_reminder', null);
    application.setDataValue('interviews', []);
  });

  it('changes status to "waiting for response"', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.updateToRestore(candidate);
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Saved for later, waiting for response, upcoming interview, received offer -> Reject
scenario.model('A "non-archived Application model" being restored', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY);

  it('rejects the change', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    expect(function () {
      application.updateToRestore(candidate);
    }).to.throw(HttpError.BadRequest, /is not archived/);
  });
});

// METHOD: Touch active reminders
scenario.model('A "saved for later Application model" touching its active reminder', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);

  it('touches our saved for later reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    var reminder = application.get('saved_for_later_reminder');
    var originalUpdatedAt = reminder.get('updated_at');
    var updatedModels = application._touchActiveReminder();
    expect(updatedModels).to.deep.equal([reminder]);
    expect(reminder.get('updated_at')).to.be.a('date');
    expect(reminder.get('updated_at')).to.greaterThan(originalUpdatedAt);
  });
});

scenario.model('An "waiting for response Application model" touching its active reminder', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY);

  it('touches our waiting for response remidner', function () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var reminder = application.get('waiting_for_response_reminder');
    var originalUpdatedAt = reminder.get('updated_at');
    var updatedModels = application._touchActiveReminder();
    expect(updatedModels).to.deep.equal([reminder]);
    expect(reminder.get('updated_at')).to.be.a('date');
    expect(reminder.get('updated_at')).to.greaterThan(originalUpdatedAt);
  });
});
scenario.model('An "upcoming interview Application model" touching its active reminder', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY);

  it('doesn\'t touch our reminders', function () {
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    var updatedModels = application._touchActiveReminder();
    expect(updatedModels).to.deep.equal([]);
  });
});

scenario.model('A "received offer Application model" touching its active reminder', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);

  it('touches our received offer reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var reminder = application.get('received_offer_reminder');
    var originalUpdatedAt = reminder.get('updated_at');
    var updatedModels = application._touchActiveReminder();
    expect(updatedModels).to.deep.equal([reminder]);
    expect(reminder.get('updated_at')).to.be.a('date');
    expect(reminder.get('updated_at')).to.greaterThan(originalUpdatedAt);
  });
});

scenario.model('An "archived Application model" touching its active reminder', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);

  it('doesn\'t touch our reminders', function () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    var updatedModels = application._touchActiveReminder();
    expect(updatedModels).to.deep.equal([]);
  });
});

// METHOD: Default content addition/removal (application date)
scenario.model('An "Application model without an application date" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);

  it('receives default application date', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('application_date_moment')).to.equal(null);
    var updatedModels = application.updateToApplied(candidate);
    expect(updatedModels).to.contain(application);
    expect(application.get('application_date_moment')).to.not.equal(null);
    // DEV: Application date should be set to today in candidate's timezone
    var expectedDateStr = new Date(dateUtils.nowInChicago()).toISOString();
    var expectedInfo = extractValues(expectedDateStr, '{date}T{full_time}');
    var actualMoment = application.get('application_date_moment').tz('UTC');
    expect(actualMoment.format('Y-MM-DD')).to.equal(expectedInfo.date);
  });
});

scenario.model('An "Application model with an application date" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY);

  it('doesn\'t lose original application date', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    expect(application.get('application_date_moment').toISOString()).to.equal('2016-01-08T00:00:00.000Z');
    var updatedModels = application.updateToInterviewChanges(candidate);
    expect(updatedModels).to.contain(application);
    expect(application.get('application_date_moment').toISOString()).to.equal('2016-01-08T00:00:00.000Z');
  });
});

// METHOD: Default content addition/removal (archived at)
scenario.model('An "archived Application model without an archived timestamp" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);

  it('receives default archived timestamp', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(application.get('archived_at_moment')).to.equal(null);
    var updatedModels = application.updateToArchived(candidate);
    expect(updatedModels).to.contain(application);
    expect(application.get('archived_at_moment')).to.not.equal(null);
    expect(application.get('archived_at_moment')).to.be.at.least(moment().subtract({hours: 1}));
    expect(application.get('archived_at_moment')).to.be.at.most(moment().add({hours: 1}));
  });
});

scenario.model('An "archived Application model with an archived timestamp" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);

  it('doesn\'t lose original archived timestamp', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    expect(application.get('archived_at_moment').toISOString()).to.equal('2016-01-18T21:00:00.000Z');
    // DEV: We have no `updateTo` methods which backfill already archived applications but this is future proofing
    var updatedModels = application._createOrRemoveDefaultContent(candidate);
    expect(updatedModels).to.contain(application);
    expect(application.get('archived_at_moment').toISOString()).to.equal('2016-01-18T21:00:00.000Z');
  });
});

scenario.model('A "non-archived Application model with an archived timestamp" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);

  it('removes archived timestamp', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    expect(application.get('archived_at_moment')).to.not.equal(null);
    var updatedModels = application.updateToRestore(candidate);
    expect(updatedModels).to.contain(application);
    expect(application.get('archived_at_moment')).to.equal(null);
  });
});

// METHOD: Default content addition/removal (reminders)
scenario.model('A "waiting for response Application model without a reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);

  it('receives a default reminder', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('waiting_for_response_reminder_id')).to.equal(null);
    var updatedModels = application.updateToApplied(candidate);
    // Application, saved for later reminder (touch), waiting for response reminder
    expect(updatedModels).to.have.length(3);
    var reminder = _.findWhere(updatedModels, {type: 'waiting_for_response'});
    expect(application.get('waiting_for_response_reminder_id')).to.not.equal(null);
    expect(reminder.get('is_enabled')).to.equal(true);
    expect(reminder.get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
    expect(reminder.get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
  });
});

scenario.model('A "waiting for response Application model with a non-recently updated reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY);
  before(function ageWaitingForResponseReminder () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var reminder = application.get('waiting_for_response_reminder');
    reminder.set('date_time_moment', moment.tz('2016-01-25T12:00:00', 'US-America/Chicago'));
    reminder.setDataValue('updated_at', new Date('2016-01-05'));
    expect(reminder.get('updated_at').toISOString()).to.equal('2016-01-05T00:00:00.000Z');
  });

  it('updates the reminder\'s date/time', function () {
    // Localize info
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var reminder = application.get('waiting_for_response_reminder');

    // Assert initial conditions
    expect(reminder.get('date_time_moment').toISOString()).to.equal('2016-01-25T18:00:00.000Z');

    // Perform update and assert results
    application.updateToInterviewChanges(candidate);
    expect(reminder.get('date_time_moment').toISOString()).to.not.equal('2016-01-25T18:00:00.000Z');
    expect(reminder.get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
    expect(reminder.get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
  });
});

scenario.model('A "waiting for response Application model with a recent past-due reminder"  being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY);

  it('updates the reminder\'s date/time', function () {
    // Localize info
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var reminder = application.get('waiting_for_response_reminder');

    // Assert initial conditions
    expect(reminder.get('updated_at')).to.be.at.least(moment().subtract({minutes: 1}));
    expect(reminder.get('date_time_moment').toISOString()).to.equal('2016-01-15T15:00:00.000Z');

    // Perform update and assert results
    application.updateToInterviewChanges(candidate);
    expect(reminder.get('date_time_moment').toISOString()).to.not.equal('2016-01-15T15:00:00.000Z');
    expect(reminder.get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
    expect(reminder.get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
  });
});

scenario.model('A "waiting for response Application model with a recent non-due reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY);
  before(function updateWaitingForResponseReminder () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var reminder = application.get('waiting_for_response_reminder');
    reminder.set('date_time_moment', moment.tz('2022-06-05T03:00:00', 'US-America/New_York'));
  });

  it('doesn\'t update reminder', function () {
    // Localize info
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var reminder = application.get('waiting_for_response_reminder');

    // Assert initial conditions
    expect(reminder.get('updated_at')).to.be.at.least(moment().subtract({minutes: 1}));
    expect(application.get('waiting_for_response_reminder_id')).to.equal('abcdef-sky-networks-reminder-uuid');

    // Perform update and assert results
    application.updateToInterviewChanges(candidate);
    expect(application.get('waiting_for_response_reminder_id')).to.equal('abcdef-sky-networks-reminder-uuid');
    expect(reminder.get('date_time_moment').toISOString()).to.equal('2022-06-05T07:00:00.000Z');
  });
});

scenario.model('An "upcoming interview Application model" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY);

  // DEV: We are verifying we don't generate reminders
  it('only updates application', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    var updatedModels = application.updateToInterviewChanges(candidate);
    expect(updatedModels).to.deep.equal([application]);
  });
});

scenario.model('A "received offer Application model without a reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY);

  it('receives a default reminder', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('received_offer_reminder_id')).to.equal(null);
    var updatedModels = application.updateToReceivedOffer(candidate);
    // Application, saved for later reminder (touch), received offer reminder
    expect(updatedModels).to.have.length(3);
    var reminder = _.findWhere(updatedModels, {type: 'received_offer'});
    expect(application.get('received_offer_reminder_id')).to.not.equal(null);
    expect(reminder.get('is_enabled')).to.equal(true);
    expect(reminder.get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
    expect(reminder.get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
  });
});

scenario.model('A "received offer Application model with a non-recently updated reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);
  before(function ageReceivedOfferReminder () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var reminder = application.get('received_offer_reminder');
    reminder.set('date_time_moment', moment.tz('2016-01-01T12:00:00', 'US-America/Chicago'));
    reminder.setDataValue('updated_at', new Date('2016-01-05'));
    expect(reminder.get('updated_at').toISOString()).to.equal('2016-01-05T00:00:00.000Z');
  });

  it('updates the reminder\'s date/time', function () {
    // Localize info
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var reminder = application.get('received_offer_reminder');

    // Assert initial conditions
    expect(reminder.get('date_time_moment').toISOString()).to.equal('2016-01-01T18:00:00.000Z');

    // Perform update and assert results
    // DEV: We would encounter this when restoring from archived but this is simpler to test
    application._createOrRemoveDefaultContent(candidate);
    expect(reminder.get('date_time_moment').toISOString()).to.not.equal('2016-01-01T18:00:00.000Z');
    expect(reminder.get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
    expect(reminder.get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
  });
});

scenario.model('A "received offer Application model with a recent past-due reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER_REMINDER_DUE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);

  it('updates the reminder\'s date/time', function () {
    // Localize info
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var reminder = application.get('received_offer_reminder');

    // Assert initial conditions
    expect(reminder.get('updated_at')).to.be.at.least(moment().subtract({minutes: 1}));
    expect(reminder.get('date_time_moment').toISOString()).to.equal('2016-01-15T15:00:00.000Z');

    // Perform update and assert results
    // DEV: We would encounter this when restoring from archived but this is simpler to test
    application._createOrRemoveDefaultContent(candidate);
    expect(reminder.get('date_time_moment').toISOString()).to.not.equal('2016-01-15T15:00:00.000Z');
    expect(reminder.get('date_time_moment')).to.be.at.least(moment().add({days: 6, hours: 20}));
    expect(reminder.get('date_time_moment')).to.be.at.most(moment().add({days: 7, hours: 4}));
  });
});

scenario.model('A "received offer Application model with a recent non-due reminder" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_RECEIVED_OFFER_KEY);
  before(function updateReceivedOfferReminder () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var reminder = application.get('received_offer_reminder');
    reminder.set('date_time_moment', moment.tz('2022-06-05T03:00:00', 'US-America/New_York'));
  });

  it('doesn\'t update reminder', function () {
    // Localize info
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var reminder = application.get('received_offer_reminder');

    // Assert initial conditions
    expect(application.get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');

    // Perform update and assert results
    // DEV: We would encounter this when restoring from archived but this is simpler to test
    application._createOrRemoveDefaultContent(candidate);
    expect(application.get('received_offer_reminder_id')).to.equal('abcdef-black-mesa-reminder-uuid');
    expect(reminder.get('date_time_moment').toISOString()).to.equal('2022-06-05T07:00:00.000Z');
  });
});

scenario.model('An "archived Application model" being backfilled', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadApplication(dbFixtures.APPLICATION_ARCHIVED_KEY);

  // DEV: We are verifying we don't generate reminders
  it('only updates application', function () {
    var candidate = this.models[dbFixtures.CANDIDATE_DEFAULT];
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    // DEV: We have no `updateTo` methods which backfill already archived applications but this is future proofing
    var updatedModels = application._createOrRemoveDefaultContent(candidate);
    expect(updatedModels).to.deep.equal([application]);
  });
});
