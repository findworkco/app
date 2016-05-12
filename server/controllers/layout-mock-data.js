// Load in our dependencies
var moment = require('moment-timezone');

// Declare and export our mock info
exports.user = {email: 'todd@findwork.co'};

// TODO: Be sure to sort by upcoming date
// TODO: Warn ourselves if we see a date that was before today
exports.upcomingInterviews = [{
  application: {
    id: 'abcdef-umbrella-corp-uuid',
    name: 'Senior Software Engineer at Umbrella Corporation',
    url: '/application/abcdef-umbrella-corp-uuid'
  },
  // Wed Jan 20 at 2:00PM CST
  // DEV: We should also populate `datetime` and `timzone` properties
  // DEV: When datetime is saved to the database, a moment instance that give us the offset
  //   Also, note that we have no numeric offset for `moment.tz`
  //   allowing it to set the appropriate one from the IANA timezone
  moment: moment.tz('2016-01-20T14:00', 'America/Chicago'),
  // TODO: Be sure to sanitize details
  details: 'Go to <a href="https://maps.google.com">1200 Lake St, Suite 303, Chicago</a>'
}, {
  application: {
    id: 'abcdef-globo-gym-uuid',
    name: 'Globo Gym',
    url: '/application/abcdef-globo-gym-uuid'
  },
  // Mon Mar 14 at 2:00PM CST
  moment: moment.tz('2016-03-14T14:00', 'America/Chicago'),
  // DEV: Alternative names for `details` are `instructions`, `info`, and `information`
  details: ''
}];

exports.waitingForResponseApplications = [{
  id: 'abcdef-sky-networks-uuid',
  add_interview_url: '/application/abcdef-sky-networks-uuid/add-interview',
  // Fri Jan 8
  application_date_moment: moment.tz('2016-01-08', 'America/Chicago'),
  archive_url: '/application/abcdef-sky-networks-uuid/archive',
  company_name: 'Sky Networks',
  human_status: 'Waiting for response',
  // Tue Feb 23
  follow_up_reminder_moment: moment.tz('2016-02-23T12:00', 'America/Chicago'),
  // Tue Feb 16
  last_contact_moment: moment.tz('2016-02-16T12:00', 'America/Chicago'),
  past_interviews: [{
    id: 'abcdef-sky-networks-interview-uuid',
    application_id: 'abcdef-sky-networks-uuid',
    details: 'Call 555-123-4567',
    // Fri Jan 15 at 9:00AM PST
    moment: moment.tz('2016-01-15T09:00', 'America/Los_Angeles'),
    pre_interview_reminder_moment: moment.tz('2016-01-15T08:00', 'America/Los_Angeles'),
    post_interview_reminder_moment: moment.tz('2016-01-15T11:00', 'America/Los_Angeles'),
    url: '/interview/abcdef-sky-networks-interview-uuid'
  }],
  posting_url: 'https://github.com/about/jobs',
  name: 'Engineer II at Sky Networks',
  notes: '100 employees, all seem robotic',
  status: 'waiting_for_response',
  received_offer_url: '/application/abcdef-sky-networks-uuid/received-offer',
  url: '/application/abcdef-sky-networks-uuid'
}];
