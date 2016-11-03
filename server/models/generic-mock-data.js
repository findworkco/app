// Load in our dependencies
var _ = require('underscore');
var moment = require('moment-timezone');
var Application = require('./application');
var Interview = require('./interview');

// DEV: We define all our mock data side by side for easy tweaking'

// Define collection for applications and interviews
var applications = [];
var interviews = [];

// Upcoming interviews
// TODO: Be sure to sort queries by upcoming date
// TODO: Warn ourselves if we see a date that was before today for upcoming interviews
// TODO: Use `getById` to resolve `application_id`
// http://docs.sequelizejs.com/en/latest/docs/instances/#values-of-an-instance
exports.upcomingInterviews = [];
applications.push({
  id: 'abcdef-umbrella-corp-uuid',
  name: 'Senior Software Engineer at Umbrella Corporation',
  status: Application.APPLICATION_STATUSES.UPCOMING_INTERVIEW
});
interviews.push({
  id: 'abcdef-umbrella-corp-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Wed Jan 20 at 2:00PM CST
  date_time_moment: moment.tz('2016-01-20T14:00', 'America/Chicago'),
  // TODO: Be sure to sanitize details (done in view)
  details: 'Go to <a href="https://maps.google.com">1200 Lake St, Suite 303, Chicago</a>'
});
exports.upcomingInterviews.push(_.extend({
  application: Application.build(applications[applications.length - 1]).get({plain: true, clone: true})
}, Interview.build(interviews[interviews.length - 1]).get({plain: true, clone: true})));

applications.push({
  id: 'abcdef-globo-gym-uuid',
  name: 'Globo Gym',
  status: Application.APPLICATION_STATUSES.UPCOMING_INTERVIEW
});
interviews.push({
  id: 'abcdef-globo-gym-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Mon Mar 14 at 2:00PM CST
  date_time_moment: moment.tz('2016-03-14T14:00', 'America/Chicago'),
  details: ''
});
exports.upcomingInterviews.push(_.extend({
  application: Application.build(applications[applications.length - 1]).get({plain: true, clone: true})
}, Interview.build(interviews[interviews.length - 1]).get({plain: true, clone: true})));

// Waiting for response applications
// TODO: Figure out whether "Last contact" was "Last event" or is missing from edit pages...
exports.waitingForResponseApplications = [];
applications.push({
  id: 'abcdef-sky-networks-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'America/Chicago'),
  archived_at_moment: null,
  company_name: 'Sky Networks',
  // Tue Feb 23
  follow_up_reminder_moment: moment.tz('2016-02-23T12:00', 'America/Chicago'),
  // Tue Feb 16
  last_contact_moment: moment.tz('2016-02-16T12:00', 'America/Chicago'),
  // past_interviews: [], // Filled out by `waitingForResponseApplications.push`
  posting_url: 'https://github.com/about/jobs',
  name: 'Engineer II at Sky Networks',
  notes: 'Phone screen (John): 100 employees, focused on AI<br/>' +
    'Website: <a href="https://sky.net/">https://sky.net/</a>',
  status: Application.APPLICATION_STATUSES.WAITING_FOR_RESPONSE
});
interviews.push({
  id: 'abcdef-sky-networks-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Fri Jan 15 at 9:00AM PST
  date_time_moment: moment.tz('2016-01-15T09:00', 'America/Los_Angeles'),
  details: 'Call 555-123-4567',
  pre_interview_reminder_moment: moment.tz('2016-01-15T08:00', 'America/Los_Angeles'),
  post_interview_reminder_moment: moment.tz('2016-01-15T11:00', 'America/Los_Angeles')
});
exports.waitingForResponseApplications.push(_.extend({
  past_interviews: [
    Interview.build(interviews[interviews.length - 1]).get({plain: true, clone: true})
  ]
}, Application.build(applications[applications.length - 1]).get({plain: true, clone: true})));

// Archived applications
exports.archivedApplications = [];
applications.push({
  id: 'abcdef-monstromart-uuid',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'America/Chicago'),
  // Mon Jan 18 at 3:00PM CST
  archived_at_moment: moment.tz('2016-01-18T15:00', 'America/Chicago'),
  company_name: 'Monstromart',
  status: Application.APPLICATION_STATUSES.ARCHIVED,
  // Tue Feb 23
  follow_up_reminder_moment: moment.tz('2016-02-23T12:00', 'America/Chicago'),
  // Tue Feb 16
  last_contact_moment: moment.tz('2016-02-16T12:00', 'America/Chicago'),
  // past_interviews: [], // Filled out by `archivedApplications.push`
  posting_url: 'https://github.com/about/jobs',
  name: 'Senior Manager at Monstromart',
  notes: '100 employees, all seem robotic',
  received_offer_url: '/application/abcdef-monstromart-uuid/received-offer',
  url: '/application/abcdef-monstromart-uuid'
});
interviews.push({
  id: 'abcdef-monstromart-interview-uuid',
  application_id: applications[applications.length - 1].id,
  // Fri Jan 15 at 9:00AM PST
  date_time_moment: moment.tz('2016-01-15T09:00', 'America/Los_Angeles'),
  details: 'Call 555-123-4567',
  pre_interview_reminder_moment: moment.tz('2016-01-15T08:00', 'America/Los_Angeles'),
  post_interview_reminder_moment: moment.tz('2016-01-15T11:00', 'America/Los_Angeles')
});
exports.archivedApplications.push(_.extend({
  past_interviews: [
    Interview.build(interviews[interviews.length - 1]).get({plain: true, clone: true})
  ]
}, Application.build(applications[applications.length - 1]).get({plain: true, clone: true})));
