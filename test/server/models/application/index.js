// Load in our dependencies
var _ = require('underscore');
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../../utils/db-fixtures');
var Application = require('../../../../server/models/application');
var ApplicationReminder = require('../../../../server/models/application-reminder');
var Candidate = require('../../../../server/models/candidate');
var Interview = require('../../../../server/models/interview');
var Reminder = require('../../../../server/models/reminder');

// Define common application setups
var validBaseApplication = {
  application_date_moment: moment('2017-01-31'),
  candidate_id: 'mock-candidate-id',
  name: 'mock name',
  notes: 'mock notes'
};
var validSavedForLaterApplication = _.defaults({
  application_date_moment: null,
  status: 'saved_for_later',
  saved_for_later_reminder_id: 'mock-reminder-id'
}, validBaseApplication);

// Start our tests
scenario.model('A valid Application model', function () {
  it('receives no validation errors', function (done) {
    var application = Application.build(_.clone(validSavedForLaterApplication));
    application.validate({skip: ['statusMatchesInterviews']}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('An Application model with an empty name', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validSavedForLaterApplication, {
      name: ''
    }));
    application.validate({skip: ['statusMatchesInterviews']}).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'name');
      expect(validationErr.errors[0]).to.have.property('message', 'Name cannot be empty');
      done();
    });
  });
});

scenario.model('An Application model with an invalid status', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'invalid_status'
    }));
    application.validate({skip: ['statusHasMatchingApplicationDate', 'statusHasMatchingReminder',
        'statusMatchesInterviews']})
        .asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'status');
      expect(validationErr.errors[0]).to.have.property('message', 'Invalid status provided');
      done();
    });
  });
});

// Reminder tests
var reminderTestSkips = {skip: ['statusHasMatchingApplicationDate', 'statusHasMatchingArchivedDate',
  'statusMatchesInterviews']};
scenario.model('A saved for later Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'saved_for_later'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[0].message).to.match(/"saved_for_later" application.+reminder set/);
      done();
    });
  });
});

scenario.model('A waiting for response Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'waiting_for_response'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[0].message).to.match(/"waiting_for_response" application.+reminder set/);
      done();
    });
  });
});

scenario.model('An upcoming interview Application model with no reminder', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'upcoming_interview'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A received offer Application model with no reminder', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'received_offer'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingReminder');
      expect(validationErr.errors[0].message).to.match(/"received_offer" application.+reminder set/);
      done();
    });
  });
});

scenario.model('An archived Application model with no reminder', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      status: 'archived'
    }));
    application.validate(reminderTestSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

// Application date tests
var applicationDateSkips = {skip: ['statusHasMatchingReminder', 'statusMatchesInterviews']};
scenario.model('A saved for later Application model with no application date', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      application_date_moment: null,
      status: 'saved_for_later'
    }));
    application.validate(applicationDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A saved for later Application model with an application date', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      // application_date_moment set by validBaseApplication
      status: 'saved_for_later'
    }));
    application.validate(applicationDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingApplicationDate');
      expect(validationErr.errors[0].message).to.contain(
        'Expected "saved_for_later" application to not have an application date set');
      done();
    });
  });
});

scenario.model('A non-saved for later Application model with no application date', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      application_date_moment: null,
      status: 'waiting_for_response'
    }));
    application.validate(applicationDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingApplicationDate');
      expect(validationErr.errors[0].message).to.contain(
        'Expected non-"saved_for_later" application to have an application date set');
      done();
    });
  });
});

scenario.model('A non-saved for later Application model with an application date', function () {
  it('receives no validation errors', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      // application_date_moment set by validBaseApplication
      status: 'waiting_for_response'
    }));
    application.validate(applicationDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

// Archived date tests
var archivedDateSkips = {skip: ['statusHasMatchingReminder', 'statusHasMatchingApplicationDate',
  'statusMatchesInterviews']};
scenario.model('A non-archived Application model with no archived date', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      archived_at_moment: null,
      status: 'waiting_for_response'
    }));
    application.validate(archivedDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

scenario.model('A non-archived Application model with an archived date', function () {
  it('receives no validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      archived_at_moment: moment.tz('2016-03-01T00:00:00', 'US-America/Chicago'),
      status: 'waiting_for_response'
    }));
    application.validate(archivedDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingArchivedDate');
      expect(validationErr.errors[0].message).to.contain(
        'Expected non-"archived" application to not have an archived at date');
      done();
    });
  });
});

scenario.model('An archived Application model with no archived date', function () {
  it('receives a validation error', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      archived_at_moment: null,
      status: 'archived'
    }));
    application.validate(archivedDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr.errors).to.have.length(1);
      expect(validationErr.errors[0]).to.have.property('path', 'statusHasMatchingArchivedDate');
      expect(validationErr.errors[0].message).to.contain(
        'Expected "archived" application to have an archived at date set');
      done();
    });
  });
});

scenario.model('An archived Application model with an archived date', function () {
  it('receives no validation errors', function (done) {
    var application = Application.build(_.extend({}, validBaseApplication, {
      archived_at_moment: moment.tz('2016-03-01T00:00:00', 'US-America/Chicago'),
      status: 'archived'
    }));
    application.validate(archivedDateSkips).asCallback(function handleError (err, validationErr) {
      expect(err).to.equal(null);
      expect(validationErr).to.equal(null);
      done();
    });
  });
});

// Closest upcoming interview
scenario.model('An Application model with no upcoming interviews', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_NO_UPCOMING_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('has no closest upcoming interview', function (done) {
    Application.find({
      where: {id: 'abcdef-sky-networks-uuid'},
      include: [{model: Interview}]
    }).asCallback(function handleFind (err, application) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Sanity check data hasn't been altered
      expect(application.get('upcoming_interviews')).to.have.length(0);

      // Perform our assertions
      var closestUpcomingInterview = application.get('closest_upcoming_interview');
      expect(closestUpcomingInterview).to.equal(null);
      done();
    });
  });
});

scenario.model('An Application model with multiple upcoming interviews', {
  dbFixtures: [dbFixtures.APPLICATION_MULTIPLE_UPCOMING_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('properly resolves closest upcoming interview', function (done) {
    Application.find({
      where: {id: 'abcdef-stark-indy-uuid'},
      include: [{model: Interview}]
    }).asCallback(function handleFind (err, application) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Sanity check data hasn't been altered
      expect(application.get('upcoming_interviews')).to.have.length(2);
      var interviewDateStrs = application.get('upcoming_interviews').map(function getInterviewDateStr (interview) {
        return interview.get('date_time_moment').toISOString();
      });
      interviewDateStrs.sort();
      expect(interviewDateStrs).to.deep.equal(
        ['2022-03-14T19:00:00.000Z', '2022-03-22T12:00:00.000Z']);

      // Perform our assertions
      var closestUpcomingInterview = application.get('closest_upcoming_interview');
      expect(closestUpcomingInterview.get('date_time_moment').toISOString())
        .to.equal('2022-03-14T19:00:00.000Z');
      done();
    });
  });
});

// Closest past interview
scenario.model('An Application model with no past interviews', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_NO_PAST_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('has no closest past interview', function (done) {
    Application.find({
      where: {id: 'abcdef-sky-networks-uuid'},
      include: [{model: Interview}]
    }).asCallback(function handleFind (err, application) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Sanity check data hasn't been altered
      expect(application.get('past_interviews')).to.have.length(0);

      // Perform our assertions
      var closestPastInterview = application.get('closest_past_interview');
      expect(closestPastInterview).to.equal(null);
      done();
    });
  });
});

scenario.model('An Application model with multiple past interviews', {
  dbFixtures: [dbFixtures.APPLICATION_MULTIPLE_PAST_INTERVIEWS, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('properly resolves closest past interview', function (done) {
    Application.find({
      where: {id: 'abcdef-globo-gym-uuid'},
      include: [{model: Interview}]
    }).asCallback(function handleFind (err, application) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Sanity check data hasn't been altered
      expect(application.get('past_interviews')).to.have.length(2);
      var interviewDateStrs = application.get('past_interviews').map(function getInterviewDateStr (interview) {
        return interview.get('date_time_moment').toISOString();
      });
      interviewDateStrs.sort();
      expect(interviewDateStrs).to.deep.equal(
        ['2016-02-18T15:00:00.000Z', '2016-03-03T00:00:00.000Z']);

      // Perform our assertions
      var closestPastInterview = application.get('closest_past_interview');
      expect(closestPastInterview.get('date_time_moment').toISOString())
        .to.equal('2016-03-03T00:00:00.000Z');
      done();
    });
  });
});

// Relationships
scenario.model('An Application model with a saved for later reminder', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function loadApplicationWithIncludes (done) {
    this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY].reload({
      include: [
        {model: ApplicationReminder, as: 'saved_for_later_reminder'},
        {model: ApplicationReminder, as: 'waiting_for_response_reminder'},
        {model: ApplicationReminder, as: 'received_offer_reminder'}
      ]
    }).asCallback(done);
  });

  it('loads saved for later reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('saved_for_later_reminder')).to.not.equal(null);
  });

  it('doesn\'t resolve saved for later reminder as waiting for response reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('waiting_for_response_reminder')).to.equal(null);
  });

  it('doesn\'t resolve saved for later reminder as received offer reminder', function () {
    var application = this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY];
    expect(application.get('received_offer_reminder')).to.equal(null);
  });
});

// DEV: This test verifies our database has proper cascading deletion hooks
scenario.model('An Application model being deleted which has interviews and reminders', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  before(function verifyCandidateExists (done) {
    Candidate.findAll().asCallback(function verifyCandidateExistsFn (err, candidates) {
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      done();
    });
  });
  before(function verifyApplicationsExist (done) {
    Application.findAll().asCallback(function verifyApplicationsExistFn (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(1);
      done();
    });
  });
  before(function verifyInterviewsExist (done) {
    Interview.findAll().asCallback(function verifyInterviewsExistFn (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(1);
      done();
    });
  });
  before(function verifyRemindersExist (done) {
    Reminder.findAll().asCallback(function verifyRemindersExistFn (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(3);
      done();
    });
  });
  before(function deleteApplication (done) {
    var application = Application.build({id: 'abcdef-sky-networks-uuid'});
    application.destroy({_sourceType: 'server', _allowNoTransaction: true}).asCallback(done);
  });

  it('doesn\'t delete candidate', function (done) {
    Candidate.findAll().asCallback(function verifyCandidateExistsFn (err, candidates) {
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      done();
    });
  });
  it('deletes applications', function (done) {
    Application.findAll().asCallback(function verifyApplicationsDeletedFn (err, applications) {
      if (err) { return done(err); }
      expect(applications).to.have.length(0);
      done();
    });
  });
  it('deletes interviews', function (done) {
    Interview.findAll().asCallback(function verifyInterviewsDeletedFn (err, interviews) {
      if (err) { return done(err); }
      expect(interviews).to.have.length(0);
      done();
    });
  });
  it('deletes reminders', function (done) {
    Reminder.findAll().asCallback(function verifyRemindersDeletedFn (err, reminders) {
      if (err) { return done(err); }
      expect(reminders).to.have.length(0);
      done();
    });
  });
});
