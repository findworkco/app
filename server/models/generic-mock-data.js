// Load in our dependencies
var assert = require('assert');
var moment = require('moment-timezone');
var Application = require('./application');
var ApplicationReminder = require('./application-reminder');
var InterviewReminder = require('./interview-reminder');

// DEV: We define all our mock data side by side for easy tweaking
// DEV: We store 2 kinds of fixtures on `exports.fixtures`
//   1) Fixtures (i.e. {model, data})
//      These use BEM-like naming to prevent collision and make identifiers predictable
//      These should rarely/never be used directly due to their verbosity
//   2) Fixture sets (i.e. [fixture1Key, fixture2Key])
//      These use CONSTANT_NAME structures and should be used directly as they cover multiple fixtures in 1

// Define collection for data
var fixtures = exports.fixtures = {};
var candidates = exports.candidates = [];
var applications = exports.applications = [];
var interviews = exports.interviews = [];
var applicationReminders = exports.applicationReminders = [];
var interviewReminders = exports.interviewReminders = [];

// Define helper functions for fixtures/mock data
var fixtureIds = {};
function registerFixture(key, mockDataArr, info) {
  // Save our fixture/mock data
  assert.strictEqual(fixtures[key], undefined, 'Fixture already exists');
  fixtures[key] = info;
  mockDataArr.push(info.data);

  // Verify we have no shared keys to prevent accidental false positives
  var id = info.data.id;
  if (id) {
    assert.strictEqual(fixtureIds[id], undefined, 'Fixture with id "' + id + '" already exists. ' +
      'Please use distinct keys for each fixture (even across parent/children) ' +
      'to prevent accidental false positive tests (e.g. id reuse)');
    fixtureIds[id] = true;
  }

  // Return our fixture key
  return key;
}
function addCandidate(key, data) {
  return registerFixture(key, candidates, {model: 'candidate', data: data});
}
function addApplication(key, data) {
  return registerFixture(key, applications, {model: 'application', data: data});
}
function addInterview(key, data) {
  return registerFixture(key, interviews, {model: 'interview', data: data});
}
function addApplicationReminder(key, data) {
  return registerFixture(key, applicationReminders, {model: 'application_reminder', data: data});
}
function addInterviewReminder(key, data) {
  return registerFixture(key, interviewReminders, {model: 'interview_reminder', data: data});
}

// Define default fixtures overall
fixtures.DEFAULT_FIXTURES = ['default__candidate'];

// Candidates
// DEFA617 = "DEFAULT" in our attempted 1337 speak
var DEFAULT_CANDIDATE_ID = 'DEFA6170-0000-4000-8000-000000000000';
fixtures.CANDIDATE_DEFAULT = [
  addCandidate('default__candidate', {
    id: DEFAULT_CANDIDATE_ID,
    email: 'mock-email@mock-domain.test',
    google_access_token: 'mock_access_token_fixtured',
    welcome_email_sent: true
  })
];
fixtures.CANDIDATE_NEW = [
  addCandidate('new__candidate', {
    email: 'mock-email@mock-domain.test',
    google_access_token: 'mock_access_token_fixtured',
    welcome_email_sent: false
  })
];
// Gemini-only mocks
addCandidate('dev-user__candidate', {
  id: 'devuser0-0000-0000-0000-000000000000',
  email: 'dev-user@findwork.test'
});
addCandidate('todd__candidate', {
  id: 'todd0000-0000-0000-0000-000000000000',
  email: 'todd@findwork.co'
});

// Received offer applications
addApplication('received-offer__application', {
  id: 'abcdef-black-mesa-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2015-12-01', 'US-America/Chicago'),
  archived_at_moment: null,
  company_name: 'Black Mesa',
  name: 'Black Mesa',
  // Mon Jan 25
  received_offer_reminder_id: 'abcdef-black-mesa-reminder-uuid',
  notes: '300 employees, all engineers/scientists',
  posting_url: 'http://www.nature.com/naturejobs/science/jobs/123456-researcher',
  status: Application.STATUSES.RECEIVED_OFFER
});
addApplicationReminder('received-offer__reminder--application', {
  id: applications[applications.length - 1].received_offer_reminder_id,
  application_id: applications[applications.length - 1].id,
  type: ApplicationReminder.TYPES.RECEIVED_OFFER,
  date_time_moment: moment.tz('2016-01-01T12:00', 'US-America/Chicago'),
  is_enabled: true
});
addInterview('received-offer__interview', {
  id: 'abcdef-black-mesa-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Wed Jan 20 at 2:00PM CST
  date_time_moment: moment.tz('2015-12-14T14:00', 'US-America/Chicago'),
  details: 'Go to underground complex',
  pre_interview_reminder_id: 'abcdef-black-mesa-reminder-pre-interview-uuid',
  post_interview_reminder_id: 'abcdef-black-mesa-reminder-post-interview-uuid'
});
addInterviewReminder('received-offer__reminder--pre-interview', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2015-12-14T11:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterviewReminder('received-offer__reminder--post-interview', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment: moment.tz('2015-12-14T17:00', 'US-America/Chicago'),
  is_enabled: false
});

// Upcoming interview applications
addApplication('upcoming-interview__application', {
  id: 'abcdef-umbrella-corp-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'US-America/Chicago'),
  archived_at_moment: null,
  company_name: 'Umbrella Corporation',
  name: 'Umbrella Corporation',
  notes: [
    '1000 employees, 200 engineers, 200 scientists, underground office',
    '',
    'Many different research opportunities. High level clearance required',
    '',
    'First round was a phone screen',
    '',
    'Need to ask about compensation'
  ].join('<br/>'),
  posting_url: 'https://www.linkedin.com/jobs/view/133713371337',
  status: Application.STATUSES.UPCOMING_INTERVIEW
});
addInterview('upcoming-interview__interview', {
  id: 'abcdef-umbrella-corp-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Wed Jan 20 at 2:00PM CST
  date_time_moment: moment.tz('2022-01-20T14:00', 'US-America/Chicago'),
  // Go to <a href="https://maps.google.com">1200 Lake St...</a>
  details: 'Go to 1200 Lake St, Suite 303, Chicago',
  pre_interview_reminder_id: 'abcdef-umbrella-corp-reminder-pre-interview-uuid',
  post_interview_reminder_id: 'abcdef-umbrella-corp-reminder-post-interview-uuid'
});
addInterviewReminder('upcoming-interview__reminder--pre-interview', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2022-01-20T11:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterviewReminder('upcoming-interview__reminder--post-interview', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment: moment.tz('2022-01-20T17:00', 'US-America/Chicago'),
  is_enabled: false
});
addApplication('upcoming-interview-2__application', {
  id: 'abcdef-globo-gym-uuid',
  // Mon Feb 1
  application_date_moment: moment.tz('2016-02-01', 'US-America/Chicago'),
  archived_at_moment: null,
  company_name: null,
  name: 'Globo Gym',
  notes: '',
  posting_url: 'http://job-openings.monster.com/monster/abcdef-ghij-klmn-opqr-stuvwxyz',
  status: Application.STATUSES.UPCOMING_INTERVIEW
});
addInterview('upcoming-interview-2__interview', {
  id: 'abcdef-globo-gym-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Mon Mar 14 at 2:00PM CST
  date_time_moment: moment.tz('2022-03-14T14:00', 'US-America/Chicago'),
  details: '',
  pre_interview_reminder_id: 'abcdef-globo-gym-reminder-pre-interview-uuid',
  post_interview_reminder_id: 'abcdef-globo-gym-reminder-post-interview-uuid'
});
addInterviewReminder('upcoming-interview-2__reminder--pre-interview', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2022-03-14T11:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterviewReminder('upcoming-interview-2__reminder--post-interview', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment: moment.tz('2022-03-14T17:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterview('upcoming-interview-2__interview--past-1', {
  id: 'abcdef-globo-gym-interview-past-1-uuid',
  application_id: applications[applications.length - 1].id,
  // Thu Feb 18 at 9:00AM CST
  date_time_moment: moment.tz('2016-02-18T09:00', 'US-America/Chicago'),
  details: '',
  pre_interview_reminder_id: 'abcdef-globo-gym-reminder-pre-interview-past-1-uuid',
  post_interview_reminder_id: 'abcdef-globo-gym-reminder-post-interview-past-1-uuid'
});
addInterviewReminder('upcoming-interview-2__reminder--pre-interview--past-1', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2016-02-18T06:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterviewReminder('upcoming-interview-2__reminder--post-interview--past-1', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment: moment.tz('2016-02-18T12:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterview('upcoming-interview-2__interview--past-2', {
  id: 'abcdef-globo-gym-interview-past-2-uuid',
  application_id: applications[applications.length - 1].id,
  // Wed Mar 2 at 6:00PM CST
  date_time_moment: moment.tz('2016-03-02T18:00', 'US-America/Chicago'),
  details: '',
  pre_interview_reminder_id: 'abcdef-globo-gym-reminder-pre-interview-past-2-uuid',
  post_interview_reminder_id: 'abcdef-globo-gym-reminder-post-interview-past-2-uuid'
});
addInterviewReminder('upcoming-interview-2__reminder--pre-interview--past-2', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2016-03-02T15:00', 'US-America/Chicago'),
  is_enabled: false
});
addInterviewReminder('upcoming-interview-2__reminder--post-interview--past-2', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment: moment.tz('2016-03-02T21:00', 'US-America/Chicago'),
  is_enabled: false
});

// Waiting for response applications
addApplication('waiting-for-response__application', {
  id: 'abcdef-sky-networks-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'US-America/Chicago'),
  archived_at_moment: null,
  company_name: 'Sky Networks',
  // Mon Jan 25
  waiting_for_response_reminder_id: 'abcdef-sky-networks-reminder-uuid',
  posting_url: 'https://github.com/about/jobs',
  name: 'Sky Networks',
  notes: 'Phone screen (John): 100 employees, focused on AI<br/>' +
    'Website: <a href="https://sky.net/">https://sky.net/</a>',
  status: Application.STATUSES.WAITING_FOR_RESPONSE
});
addApplicationReminder('waiting-for-response__reminder--application', {
  id: applications[applications.length - 1].waiting_for_response_reminder_id,
  application_id: applications[applications.length - 1].id,
  type: ApplicationReminder.TYPES.WAITING_FOR_RESPONSE,
  date_time_moment: moment.tz('2016-01-25T12:00', 'US-America/Chicago'),
  is_enabled: true
});
addInterview('waiting-for-response__interview', {
  id: 'abcdef-sky-networks-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Fri Jan 15 at 9:00AM PST
  date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Los_Angeles'),
  details: 'Call 555-123-4567',
  pre_interview_reminder_id: 'abcdef-sky-networks-reminder-pre-interview-uuid',
  post_interview_reminder_id: 'abcdef-sky-networks-reminder-post-interview-uuid'
});
addInterviewReminder('waiting-for-response__reminder--pre-interview', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2016-01-15T08:00', 'US-America/Los_Angeles'),
  is_enabled: true
});
addInterviewReminder('waiting-for-response__reminder--post-interview', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment:  moment.tz('2016-01-15T11:00', 'US-America/Los_Angeles'),
  is_enabled: true
});

// Saved for later applications
addApplication('saved-for-later__application', {
  id: 'abcdef-intertrode-uuid',
  application_date_moment: null,
  archived_at_moment: null,
  created_at: moment.tz('2015-12-19T12:00', 'US-America/Chicago').toDate(),
  name: 'Intertrode',
  // Mon Jan 25
  saved_for_later_reminder_id: 'abcdef-intertrode-reminder-uuid',
  notes: '',
  posting_url: 'https://www.dice.com/jobs/detail/Business-Systems-Analyst-Springfield-USA-12345/1234567/123456',
  status: Application.STATUSES.SAVED_FOR_LATER
});
addApplicationReminder('saved-for-later__reminder--application', {
  id: applications[applications.length - 1].saved_for_later_reminder_id,
  application_id: applications[applications.length - 1].id,
  type: ApplicationReminder.TYPES.SAVED_FOR_LATER,
  date_time_moment: moment.tz('2016-06-20T12:00', 'US-America/Chicago'),
  is_enabled: true
});

// Archived applications
addApplication('archived__application', {
  id: 'abcdef-monstromart-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'US-America/Chicago'),
  // Mon Jan 18 at 3:00PM CST
  archived_at_moment: moment.tz('2016-01-18T15:00', 'US-America/Chicago'),
  company_name: 'Monstromart',
  status: Application.STATUSES.ARCHIVED,
  posting_url: 'https://github.com/about/jobs',
  name: 'Monstromart',
  notes: 'Sounds like a great career opportunity'
});
addInterview('archived__interview', {
  id: 'abcdef-monstromart-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Fri Jan 15 at 9:00AM PST
  date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Los_Angeles'),
  details: 'Wait for call from Bob',
  pre_interview_reminder_id: 'abcdef-monstromart-reminder-pre-interview-uuid',
  post_interview_reminder_id: 'abcdef-monstromart-reminder-post-interview-uuid'
});
addInterviewReminder('archived__reminder--pre-interview', {
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2016-01-15T08:00', 'US-America/Los_Angeles'),
  is_enabled: true
});
addInterviewReminder('archived__reminder--post-interview', {
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  interview_id: interviews[interviews.length - 1].id,
  type: InterviewReminder.TYPES.POST_INTERVIEW,
  date_time_moment:  moment.tz('2016-01-15T11:00', 'US-America/Los_Angeles'),
  is_enabled: true
});
