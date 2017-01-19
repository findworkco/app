// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var HttpError = require('http-errors');
var dbFixtures = require('../../utils/db-fixtures');
var Application = require('../../../../server/models/application');
var ApplicationReminder = require('../../../../server/models/application-reminder');
var Interview = require('../../../../server/models/interview');

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
scenario.model('A saved for later Application model being applied to', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('updates status to "Waiting for response"', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    application.updateToApplied();
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Waiting for response, upcoming interview, received offer, archived -> Reject
scenario.model('A non-saved for later Application model being applied to', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('rejects the change', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(function () {
      application.updateToApplied();
    }).to.throw(HttpError.BadRequest, /already been applied to/);
  });
});

// ACTION: Added/updated/removed interview
// Received offer, archived -> Same/ignore
scenario.model('An interview-insensitive Application model with an interview addition/update/removal', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviews (done) {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.reload({include: [{model: Interview}]}).asCallback(done);
  });

  it('doesn\'t affect its status', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToInterviewChanges();
    expect(application.get('status')).to.equal('received_offer');
  });
});

// Saved for later, waiting for response, upcoming interview
//   + upcoming interview -> Upcoming interview
scenario.model('An interview-sensitive Application model with an upcoming interview ' +
    'and interview addition/update/removal', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviews (done) {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    application.reload({include: [{model: Interview}]}).asCallback(done);
  });
  before(function addUpcomingInterview () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    var interview = Interview.build({date_time_moment: moment().add({weeks: 1}).tz('UTC')});
    application.set('interviews', [interview]);
  });

  it('updates its status to "upcoming interview"', function () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    application.updateToInterviewChanges();
    expect(application.get('status')).to.equal('upcoming_interview');
  });
});

// Saved for later, waiting for response, upcoming interview
//   + no upcoming interview -> Waiting for response
scenario.model('An interview-sensitive Application model with no upcoming interviews ' +
    'and interview addition/update/removal', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviews (done) {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    application.reload({include: [{model: Interview}]}).asCallback(done);
  });
  before(function addPastInterview () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    var interview = Interview.build({date_time_moment: moment().subtract({weeks: 1}).tz('UTC')});
    application.set('interviews', [interview]);
  });

  // DEV: In saved for later case, this would be "Saved for later" getting a past interview which means they've applied
  it('updates its status to "upcoming interview"', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    application.updateToInterviewChanges();
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// ACTION: Received offer
// Saved for later, waiting for response, upcoming interview -> Received offer
scenario.model('An offer-tolerant Application model receiving an offer', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('updates status to "Waiting for response"', function () {
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    application.updateToReceivedOffer();
    expect(application.get('status')).to.equal('received_offer');
  });
});

// Received offer, archived -> Reject
scenario.model('An offer-intolerant Application model receiving an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('rejects the change', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    expect(function () {
      application.updateToReceivedOffer();
    }).to.throw(HttpError.BadRequest, /already received an offer or is archived/);
  });
});

// ACTION: Remove offer
// Received offer + upcoming interview -> Upcoming interview
var removeOfferReloadOptions = {
  include: [
    {model: Interview},
    {model: ApplicationReminder, as: 'waiting_for_response_reminder'}
  ]
};
scenario.model('A received offer Application model with an upcoming interview removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.reload(removeOfferReloadOptions).asCallback(done);
  });
  before(function addUpcomingInterview () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    var interview = Interview.build({date_time_moment: moment().add({weeks: 1}).tz('UTC')});
    application.set('interviews', [interview]);
  });

  it('changes status to "upcoming interview"', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToRemoveOffer();
    expect(application.get('status')).to.equal('upcoming_interview');
  });
});

// Received offer + no upcoming interview + was waiting for response -> Waiting for response
scenario.model('A received offer Application model ' +
    'with no upcoming interview and previous "waiting for response" state removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.reload(removeOfferReloadOptions).asCallback(done);
  });
  before(function addWaitingForResponseReminder () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.set('waiting_for_response_reminder', ApplicationReminder.build({}));
  });

  it('changes status to "waiting for response"', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToRemoveOffer();
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Received offer + no upcoming interview + never waiting for response -> Waiting for response
// DEV: We could move to "Saved for later" but it causes more complication in code than it's worth =/
scenario.model('A received offer Application model ' +
    'with no upcoming interview and no previous "waiting for response" state removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.reload(removeOfferReloadOptions).asCallback(done);
  });
  before(function removeWaitingForResponseReminder () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.set('waiting_for_response_reminder', null);
  });

  it('changes status to "waiting for response"', function () {
    var application = this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY];
    application.updateToRemoveOffer();
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Saved for later, waiting for response, upcoming interview, archived -> Same/ignore
scenario.model('A non-received offer Application model removing an offer', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    application.reload(removeOfferReloadOptions).asCallback(done);
  });

  it('rejects the change', function () {
    var application = this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY];
    expect(function () {
      application.updateToRemoveOffer();
    }).to.throw(HttpError.BadRequest, /doesn\'t have an offer or is archived/);
  });
});

// ACTION: Archive
// Waiting for response, upcoming interview, received offer -> Archived
scenario.model('A non-archived non-saved for later Application model being archived', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('updates status to "Archived"', function () {
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    application.updateToArchived();
    expect(application.get('status')).to.equal('archived');
  });
});

// Saved for later -> Same/ignore
scenario.model('A saved for later Application model being archived', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('rejects the change', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(function () {
      application.updateToArchived();
    }).to.throw(HttpError.BadRequest, /is already archived or cannot be/);
  });
});

// Archived -> Same/ignore
scenario.model('An archived Application model being archived', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('rejects the change', function () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    expect(function () {
      application.updateToArchived();
    }).to.throw(HttpError.BadRequest, /is already archived or cannot be/);
  });
});

// ACTION: Restore
// Archived + received offer reminder -> received offer
var restoreReloadOptions = {
  include: [
    {model: Interview},
    {model: ApplicationReminder, as: 'received_offer_reminder'}
  ]
};
scenario.model('An archived Application model that had received an offer being restored', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.reload(restoreReloadOptions).asCallback(done);
  });
  before(function addReceivedOfferReminder () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.set('received_offer_reminder', ApplicationReminder.build({}));
  });

  it('changes status to "received offer"', function () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.updateToRestore();
    expect(application.get('status')).to.equal('received_offer');
  });
});

// Archived + upcoming interview -> upcoming interview
scenario.model('An archived Application model with no offer but with upcoming interview being restored', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.reload(restoreReloadOptions).asCallback(done);
  });
  before(function removeReminderAndAddUpcomingInterview () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.set('received_offer_reminder', null);
    var interview = Interview.build({date_time_moment: moment().add({weeks: 1}).tz('UTC')});
    application.set('interviews', [interview]);
  });

  it('changes status to "received offer"', function () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.updateToRestore();
    expect(application.get('status')).to.equal('upcoming_interview');
  });
});

// Archived + no upcoming interview -> waiting for response
scenario.model('An archived Application model with no offer and no upcoming interview being restored', {
  dbFixtures: [dbFixtures.APPLICATION_ARCHIVED, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.reload(restoreReloadOptions).asCallback(done);
  });
  before(function removeReminderAndInterviews () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.set('received_offer_reminder', null);
    application.set('interviews', []);
  });

  it('changes status to "waiting for response"', function () {
    var application = this.models[dbFixtures.APPLICATION_ARCHIVED_KEY];
    application.updateToRestore();
    expect(application.get('status')).to.equal('waiting_for_response');
  });
});

// Saved for later, waiting for response, upcoming interview, received offer -> Same/ignore
scenario.model('A non-archived Application model being restored', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function reloadApplicationWithInterviewsAndReminders (done) {
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    application.reload(restoreReloadOptions).asCallback(done);
  });

  it('rejects the change', function () {
    var application = this.models[dbFixtures.APPLICATION_UPCOMING_INTERVIEW_KEY];
    expect(function () {
      application.updateToRestore();
    }).to.throw(HttpError.BadRequest, /is not archived/);
  });
});
