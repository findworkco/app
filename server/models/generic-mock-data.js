// Load in our dependencies
var moment = require('moment-timezone');
var Application = require('./application');
var Reminder = require('./reminder');

// DEV: We define all our mock data side by side for easy tweaking'

// Define collection for data
var candidates = exports.candidates = [];
var applications = exports.applications = [];
var interviews = exports.interviews = [];
var reminders = exports.reminders = [];

// Candidates
candidates.push({
  id: 'todd0000-0000-0000-0000-000000000000',
  email: 'todd@findwork.co'
});
candidates.push({
  id: 'devuser0-0000-0000-0000-000000000000',
  email: 'dev-user@findwork.test'
});

// Received offer applications
applications.push({
  id: 'abcdef-black-mesa-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2015-12-01', 'America/Chicago'),
  archived_at_moment: null,
  company_name: 'Black Mesa',
  name: 'Black Mesa',
  // Mon Jan 25
  received_offer_reminder_id: 'abcdef-black-mesa-reminder-uuid',
  notes: '300 employees, all engineers/scientists',
  // past_interviews: [], // Filled out by `applicationMockData`
  posting_url: 'http://www.nature.com/naturejobs/science/jobs/123456-researcher',
  status: Application.APPLICATION_STATUSES.RECEIVED_OFFER
  // upcoming_interviews: [], // Filled out by `applicationMockData`
});
reminders.push({
  id: applications[applications.length - 1].received_offer_reminder_id,
  parent_id: applications[applications.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.APPLICATION,
  type: Reminder.TYPES.RECEIVED_OFFER,
  date_time_moment: moment.tz('2016-01-01T12:00', 'America/Chicago'),
  is_enabled: true
});
interviews.push({
  id: 'abcdef-black-mesa-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Wed Jan 20 at 2:00PM CST
  date_time_moment: moment.tz('2015-12-14T14:00', 'America/Chicago'),
  details: 'Go to underground complex'
});

// Upcoming interview applications
applications.push({
  id: 'abcdef-umbrella-corp-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'America/Chicago'),
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
  // past_interviews: [], // Filled out by `applicationMockData`
  posting_url: 'https://www.linkedin.com/jobs/view/133713371337',
  status: Application.APPLICATION_STATUSES.UPCOMING_INTERVIEW
  // upcoming_interviews: [], // Filled out by `applicationMockData`
});
interviews.push({
  id: 'abcdef-umbrella-corp-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Wed Jan 20 at 2:00PM CST
  date_time_moment: moment.tz('2022-01-20T14:00', 'America/Chicago'),
  // Go to <a href="https://maps.google.com">1200 Lake St...</a>
  details: 'Go to 1200 Lake St, Suite 303, Chicago'
});
applications.push({
  id: 'abcdef-globo-gym-uuid',
  // Mon Feb 1
  application_date_moment: moment.tz('2016-02-01', 'America/Chicago'),
  archived_at_moment: null,
  company_name: null,
  name: 'Globo Gym',
  notes: '',
  // past_interviews: [], // Filled out by `applicationMockData`
  posting_url: 'http://job-openings.monster.com/monster/abcdef-ghij-klmn-opqr-stuvwxyz',
  status: Application.APPLICATION_STATUSES.UPCOMING_INTERVIEW
  // upcoming_interviews: [], // Filled out by `applicationMockData`
});
interviews.push({
  id: 'abcdef-globo-gym-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Mon Mar 14 at 2:00PM CST
  date_time_moment: moment.tz('2022-03-14T14:00', 'America/Chicago'),
  details: ''
});
interviews.push({
  id: 'abcdef-globo-gym-interview-past-1',
  application_id: applications[applications.length - 1].id,
  // Thu Feb 18 at 9:00AM CST
  date_time_moment: moment.tz('2016-02-18T09:00', 'America/Chicago'),
  details: ''
});
interviews.push({
  id: 'abcdef-globo-gym-interview-past-2',
  application_id: applications[applications.length - 1].id,
  // Wed Mar 2 at 6:00PM CST
  date_time_moment: moment.tz('2016-03-02T18:00', 'America/Chicago'),
  details: ''
});

// Waiting for response applications
applications.push({
  id: 'abcdef-sky-networks-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'America/Chicago'),
  archived_at_moment: null,
  company_name: 'Sky Networks',
  // Mon Jan 25
  waiting_for_response_reminder_id: 'abcdef-sky-networks-reminder-uuid',
  // past_interviews: [], // Filled out by `applicationMockData`
  posting_url: 'https://github.com/about/jobs',
  name: 'Sky Networks',
  notes: 'Phone screen (John): 100 employees, focused on AI<br/>' +
    'Website: <a href="https://sky.net/">https://sky.net/</a>',
  status: Application.APPLICATION_STATUSES.WAITING_FOR_RESPONSE
  // upcoming_interviews: [], // Filled out by `applicationMockData`
});
reminders.push({
  id: applications[applications.length - 1].waiting_for_response_reminder_id,
  parent_id: applications[applications.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.APPLICATION,
  type: Reminder.TYPES.WAITING_FOR_RESPONSE,
  date_time_moment: moment.tz('2016-01-25T12:00', 'America/Chicago'),
  is_enabled: true
});
interviews.push({
  id: 'abcdef-sky-networks-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Fri Jan 15 at 9:00AM PST
  date_time_moment: moment.tz('2016-01-15T09:00', 'America/Los_Angeles'),
  details: 'Call 555-123-4567',
  pre_interview_reminder_id: 'abcdef-sky-networks-interview-pre-reminder-uuid',
  post_interview_reminder_id: 'abcdef-sky-networks-interview-post-reminder-uuid'
});
reminders.push({
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  parent_id: interviews[interviews.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.INTERVIEW,
  type: Reminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2016-01-15T08:00', 'America/Los_Angeles'),
  is_enabled: true
});
reminders.push({
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  parent_id: interviews[interviews.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.INTERVIEW,
  type: Reminder.TYPES.POST_INTERVIEW,
  date_time_moment:  moment.tz('2016-01-15T11:00', 'America/Los_Angeles'),
  is_enabled: true
});

// Saved for later applications
applications.push({
  id: 'abcdef-intertrode-uuid',
  application_date_moment: null,
  archived_at_moment: null,
  created_at: moment.tz('2015-12-19T12:00', 'America/Chicago').toDate(),
  name: 'Intertrode',
  // Mon Jan 25
  saved_for_later_reminder_id: 'abcdef-intertrode-reminder-uuid',
  notes: '',
  // past_interviews: [], // Filled out by `applicationMockData`
  posting_url: 'https://www.dice.com/jobs/detail/Business-Systems-Analyst-Springfield-USA-12345/1234567/123456',
  status: Application.APPLICATION_STATUSES.SAVED_FOR_LATER
  // upcoming_interviews: [], // Filled out by `applicationMockData`
});
reminders.push({
  id: applications[applications.length - 1].saved_for_later_reminder_id,
  parent_id: applications[applications.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.APPLICATION,
  type: Reminder.TYPES.SAVED_FOR_LATER,
  date_time_moment: moment.tz('2016-06-20T12:00', 'America/Chicago'),
  is_enabled: true
});

// Archived applications
applications.push({
  id: 'abcdef-monstromart-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'America/Chicago'),
  // Mon Jan 18 at 3:00PM CST
  archived_at_moment: moment.tz('2016-01-18T15:00', 'America/Chicago'),
  company_name: 'Monstromart',
  status: Application.APPLICATION_STATUSES.ARCHIVED,
  // past_interviews: [], // Filled out by `applicationMockData`
  posting_url: 'https://github.com/about/jobs',
  name: 'Monstromart',
  notes: 'Sounds like a great career opportunity'
  // upcoming_interviews: [], // Filled out by `applicationMockData`
});
interviews.push({
  id: 'abcdef-monstromart-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Fri Jan 15 at 9:00AM PST
  date_time_moment: moment.tz('2016-01-15T09:00', 'America/Los_Angeles'),
  details: 'Wait for call from Bob',
  pre_interview_reminder_id: 'abcdef-monstromart-interview-pre-reminder-uuid',
  post_interview_reminder_id: 'abcdef-monstromart-interview-post-reminder-uuid'
});
reminders.push({
  id: interviews[interviews.length - 1].pre_interview_reminder_id,
  parent_id: interviews[interviews.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.INTERVIEW,
  type: Reminder.TYPES.PRE_INTERVIEW,
  date_time_moment: moment.tz('2016-01-15T08:00', 'America/Los_Angeles'),
  is_enabled: true
});
reminders.push({
  id: interviews[interviews.length - 1].post_interview_reminder_id,
  parent_id: interviews[interviews.length - 1].id,
  parent_type: Reminder.PARENT_TYPES.INTERVIEW,
  type: Reminder.TYPES.POST_INTERVIEW,
  date_time_moment:  moment.tz('2016-01-15T11:00', 'America/Los_Angeles'),
  is_enabled: true
});
