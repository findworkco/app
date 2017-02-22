// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../../utils/db-fixtures');
var InterviewReminder = require('../../../../server/models/interview-reminder');
var reminderUtils = require('../../../../server/models/utils/reminder');
var sinonUtils = require('../../../utils/sinon');

// Start our tests
function reloadUpcomingInterview() {
  before(function reloadApplicationWithReminders (done) {
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    interview.reload({
      include: [
        {model: InterviewReminder, as: 'pre_interview_reminder'},
        {model: InterviewReminder, as: 'post_interview_reminder'}
      ]
    }).asCallback(done);
  });
}
scenario.model('An Interview model updating unsent reminders', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadUpcomingInterview();
  sinonUtils.spy(reminderUtils, 'shouldReplaceReminder');

  it('updates the reminders', function () {
    // Verify original state
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    var originalPreReminder = interview.get('pre_interview_reminder');
    expect(originalPreReminder.get('sent_at_moment')).to.equal(null);
    expect(originalPreReminder.get('is_enabled')).to.equal(false);
    expect(originalPreReminder.get('date_time_datetime').toISOString()).to.equal('2022-01-20T17:00:00.000Z');
    expect(originalPreReminder.get('date_time_timezone')).to.equal('US-America/Chicago');
    var originalPostReminder = interview.get('post_interview_reminder');
    expect(originalPostReminder.get('sent_at_moment')).to.equal(null);
    expect(originalPostReminder.get('is_enabled')).to.equal(false);
    expect(originalPostReminder.get('date_time_datetime').toISOString()).to.equal('2022-01-20T23:00:00.000Z');
    expect(originalPostReminder.get('date_time_timezone')).to.equal('US-America/Chicago');

    // Update our reminder and assert
    interview.updateOrReplacePreInterviewReminder({
      is_enabled: true,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });
    interview.updateOrReplacePostInterviewReminder({
      is_enabled: true,
      date_time_moment: moment.tz('2022-05-04T06:02:03', 'GB-Europe/London')
    });
    expect(originalPreReminder.get('is_enabled')).to.equal(true);
    expect(originalPreReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(originalPreReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
    expect(originalPostReminder.get('is_enabled')).to.equal(true);
    expect(originalPostReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T05:02:03.000Z');
    expect(originalPostReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
    var shouldReplaceReminderSpy = reminderUtils.shouldReplaceReminder;
    expect(shouldReplaceReminderSpy.callCount).to.equal(2);
  });
});

scenario.model('An Application model updating a sent yet unchanged saved for later reminder', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadUpcomingInterview();

  it('doesn\'t replace the reminder', function () {
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    expect(interview.get('pre_interview_reminder_id')).to.equal('umbrella-corp-reminder-pre-int-uuid');
    expect(interview.get('post_interview_reminder_id')).to.equal('umbrella-corp-reminder-post-int-uuid');

    interview.get('pre_interview_reminder').set('sent_at_moment', moment());
    interview.get('post_interview_reminder').set('sent_at_moment', moment());
    interview.updateOrReplacePreInterviewReminder({
      is_enabled: false
    });
    interview.updateOrReplacePostInterviewReminder({
      is_enabled: false
    });

    expect(interview.get('pre_interview_reminder_id')).to.equal('umbrella-corp-reminder-pre-int-uuid');
    expect(interview.get('post_interview_reminder_id')).to.equal('umbrella-corp-reminder-post-int-uuid');
  });
});

scenario.model('An Application model updating a sent and changed saved for later reminder', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  reloadUpcomingInterview();

  it('replaces the reminder', function () {
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    expect(interview.get('pre_interview_reminder_id')).to.equal('umbrella-corp-reminder-pre-int-uuid');
    expect(interview.get('post_interview_reminder_id')).to.equal('umbrella-corp-reminder-post-int-uuid');

    interview.get('pre_interview_reminder').set('sent_at_moment', moment());
    interview.get('post_interview_reminder').set('sent_at_moment', moment());
    var newPreReminder = interview.updateOrReplacePreInterviewReminder({
      is_enabled: true,
      date_time_moment: moment.tz('2022-05-04T04:02:03', 'GB-Europe/London')
    });
    var newPostReminder = interview.updateOrReplacePostInterviewReminder({
      is_enabled: true,
      date_time_moment: moment.tz('2022-05-04T06:02:03', 'GB-Europe/London')
    });

    expect(interview.get('pre_interview_reminder_id')).to.be.a('string');
    expect(interview.get('pre_interview_reminder_id')).to.not.equal('umbrella-corp-reminder-pre-int-uuid');
    expect(interview.get('post_interview_reminder_id')).to.be.a('string');
    expect(interview.get('post_interview_reminder_id')).to.not.equal('umbrella-corp-reminder-post-int-uuid');
    expect(newPreReminder.get('interview_id')).to.equal('abcdef-umbrella-corp-interview-uuid');
    expect(newPreReminder.get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
    expect(newPreReminder.get('is_enabled')).to.equal(true);
    expect(newPreReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T03:02:03.000Z');
    expect(newPreReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
    expect(newPostReminder.get('interview_id')).to.equal('abcdef-umbrella-corp-interview-uuid');
    expect(newPostReminder.get('candidate_id')).to.equal('default0-0000-0000-0000-000000000000');
    expect(newPostReminder.get('is_enabled')).to.equal(true);
    expect(newPostReminder.get('date_time_datetime').toISOString()).to.equal('2022-05-04T05:02:03.000Z');
    expect(newPostReminder.get('date_time_timezone')).to.equal('GB-Europe/London');
  });
});
