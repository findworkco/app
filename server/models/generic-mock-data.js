// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var moment = require('moment-timezone');
var Application = require('./application');
var ApplicationReminder = require('./application-reminder');
var Interview = require('./interview');
var InterviewReminder = require('./interview-reminder');
var slice = Array.prototype.slice;

// DEV: We define all our mock data side by side for easy tweaking
// DEV: We store 2 kinds of fixtures on `exports.fixtures`
//   1) Fixtures (i.e. {model, data})
//      These use BEM-like naming to prevent collision and make identifiers predictable
//      These should rarely/never be used directly due to their verbosity
//   2) Fixture sets (i.e. [fixture1Key, fixture2Key])
//      These use CONSTANT_NAME structures and should be used directly as they cover multiple fixtures in 1

// Define collection for data
var candidates = exports.candidates = [];
var applications = exports.applications = [];
var interviews = exports.interviews = [];
var applicationReminders = exports.applicationReminders = [];
var interviewReminders = exports.interviewReminders = [];

// Define helper functions for fixtures/mock data
var fixtureIds = {};
function registerFixture(key, mockDataArr, info) {
  // Save our fixture/mock data
  assert.strictEqual(exports[key], undefined, 'Fixture already exists');
  exports[key] = info;
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
exports.DEFAULT_FIXTURES = ['default__candidate'];

// Fixtures are defined in 2 parts: Static fixtures and overridden fixtures
//   Static fixtures have no cross-pollenation between parts
//   Overridden fixtures referenece static fixtures but add override pieces
//     For example: Received offer with upcoming interview

// Static fixtures
// Candidates
var DEFAULT_CANDIDATE_ID = 'default0-0000-0000-0000-000000000000';
exports.CANDIDATE_DEFAULT = [
  addCandidate('default__candidate', {
    id: DEFAULT_CANDIDATE_ID,
    email: 'mock-email@mock-domain.test',
    google_access_token: 'mock_access_token_fixtured',
    welcome_email_sent: true
  })
];
exports.CANDIDATE_ALT = [
  addCandidate('alt__candidate', {
    id: 'alt00000-0000-0000-0000-000000000000',
    email: 'alt-email@mock-domain.test',
    google_access_token: 'mock_access_token_fixtured_alt',
    welcome_email_sent: true
  })
];
exports.CANDIDATE_NEW = [
  addCandidate('new__candidate', {
    id: 'newbie00-0000-0000-0000-000000000000',
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
exports.APPLICATION_RECEIVED_OFFER_KEY = 'received-offer__application';
exports.INTERVIEW_RECEIVED_OFFER_KEY = 'received-offer__interview';
exports.REMINDER_RECEIVED_OFFER_KEY = 'received-offer__reminder--application';
exports.APPLICATION_RECEIVED_OFFER = exports.APPLICATION_BLACK_MESA = [
  addApplication(exports.APPLICATION_RECEIVED_OFFER_KEY, {
    id: 'abcdef-black-mesa-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Fri Jan 8
    application_date_moment: moment('2015-12-01'),
    archived_at_moment: null,
    company_name: 'Black Mesa Labs',
    name: 'Black Mesa',
    // Mon Jan 25
    received_offer_reminder_id: 'abcdef-black-mesa-reminder-uuid',
    notes: '300 employees, all engineers/scientists',
    posting_url: 'https://www.nature.com/naturejobs/science/jobs/123456-researcher',
    status: Application.STATUSES.RECEIVED_OFFER
  }),
  exports.REMINDER_RECEIVED_OFFER = [
    addApplicationReminder(exports.REMINDER_RECEIVED_OFFER_KEY, {
      id: applications[applications.length - 1].received_offer_reminder_id,
      application_id: applications[applications.length - 1].id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      type: ApplicationReminder.TYPES.RECEIVED_OFFER,
      date_time_moment: moment.tz('2016-01-01T12:00', 'US-America/Chicago'),
      is_enabled: true
    })
  ],
  addInterview(exports.INTERVIEW_RECEIVED_OFFER_KEY, {
    id: 'abcdef-black-mesa-interview-uuid',
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Wed Jan 20 at 2:00PM CST
    date_time_moment: moment.tz('2015-12-14T14:00', 'US-America/Chicago'),
    details: 'Go to underground complex',
    pre_interview_reminder_id: 'black-mesa-reminder-pre-int-uuid',
    post_interview_reminder_id: 'black-mesa-reminder-post-int-uuid'
  }),
  addInterviewReminder('received-offer__reminder--pre-interview', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2015-12-14T11:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterviewReminder('received-offer__reminder--post-interview', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment: moment.tz('2015-12-14T17:00', 'US-America/Chicago'),
    is_enabled: false
  })
];

// Upcoming interview applications
exports.APPLICATION_UPCOMING_INTERVIEW_KEY = exports.APPLICATION_UMBRELLA_CORP_KEY =
  'upcoming-interview__application';
exports.INTERVIEW_UPCOMING_INTERVIEW_KEY = 'upcoming-interview__interview';
exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY = 'upcoming-interview__reminder--pre-interview';
exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_KEY = 'upcoming-interview__reminder--post-interview';
exports.APPLICATION_UPCOMING_INTERVIEW = exports.APPLICATION_UMBRELLA_CORP = [
  addApplication(exports.APPLICATION_UPCOMING_INTERVIEW_KEY, {
    id: 'abcdef-umbrella-corp-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Fri Jan 8
    application_date_moment: moment('2016-01-08'),
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
  }),
  exports.INTERVIEW_UPCOMING_INTERVIEW = [
    addInterview(exports.INTERVIEW_UPCOMING_INTERVIEW_KEY, {
      id: 'abcdef-umbrella-corp-interview-uuid',
      application_id: applications[applications.length - 1].id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      // Wed Jan 20 at 2:00PM CST
      date_time_moment: moment.tz('2022-01-20T14:00', 'US-America/Chicago'),
      // Go to <a href="https://maps.google.com">1200 Lake St...</a>
      details: 'Go to 1200 Lake St, Suite 303, Chicago',
      pre_interview_reminder_id: 'umbrella-corp-reminder-pre-int-uuid',
      post_interview_reminder_id: 'umbrella-corp-reminder-post-int-uuid'
    }),
    addInterviewReminder(exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY, {
      id: interviews[interviews.length - 1].pre_interview_reminder_id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      interview_id: interviews[interviews.length - 1].id,
      type: InterviewReminder.TYPES.PRE_INTERVIEW,
      date_time_moment: moment.tz('2022-01-20T11:00', 'US-America/Chicago'),
      is_enabled: false
    }),
    addInterviewReminder(exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_KEY, {
      id: interviews[interviews.length - 1].post_interview_reminder_id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      interview_id: interviews[interviews.length - 1].id,
      type: InterviewReminder.TYPES.POST_INTERVIEW,
      date_time_moment: moment.tz('2022-01-20T17:00', 'US-America/Chicago'),
      is_enabled: false
    })
  ]
];
exports.INTERVIEW_UPCOMING_INTERVIEW_2_UPCOMING_KEY = 'upcoming-interview-2__interview';
exports.REMINDER_UPCOMING_INTERVIEW_2_UPCOMING_PRE_INTERVIEW_KEY = 'upcoming-interview-2__reminder--pre-interview';
exports.REMINDER_UPCOMING_INTERVIEW_2_UPCOMING_POST_INTERVIEW_KEY = 'upcoming-interview-2__reminder--post-interview';
exports.APPLICATION_UPCOMING_INTERVIEW_2 = exports.APPLICATION_MULTIPLE_PAST_INTERVIEWS =
    exports.APPLICATION_GLOBO_GYM = [
  addApplication('upcoming-interview-2__application', {
    id: 'abcdef-globo-gym-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Mon Feb 1
    application_date_moment: moment('2016-02-01'),
    archived_at_moment: null,
    company_name: '',
    name: 'Globo Gym',
    notes: '',
    posting_url: 'http://job-openings.monster.com/monster/abcdef-ghij-klmn-opqr-stuvwxyz',
    status: Application.STATUSES.UPCOMING_INTERVIEW
  }),
  exports.INTERVIEW_UPCOMING_INTERVIEW_2_UPCOMING = [
    addInterview(exports.INTERVIEW_UPCOMING_INTERVIEW_2_UPCOMING_KEY, {
      id: 'abcdef-globo-gym-interview-uuid',
      application_id: applications[applications.length - 1].id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      // Mon Mar 14 at 2:00PM CST
      date_time_moment: moment.tz('2022-03-14T14:00', 'US-America/Chicago'),
      details: '',
      pre_interview_reminder_id: 'globo-gym-reminder-pre-int-uuid',
      post_interview_reminder_id: 'globo-gym-reminder-post-int-uuid'
    }),
    addInterviewReminder(exports.REMINDER_UPCOMING_INTERVIEW_2_UPCOMING_PRE_INTERVIEW_KEY, {
      id: interviews[interviews.length - 1].pre_interview_reminder_id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      interview_id: interviews[interviews.length - 1].id,
      type: InterviewReminder.TYPES.PRE_INTERVIEW,
      date_time_moment: moment.tz('2022-03-14T11:00', 'US-America/Chicago'),
      is_enabled: false
    }),
    addInterviewReminder(exports.REMINDER_UPCOMING_INTERVIEW_2_UPCOMING_POST_INTERVIEW_KEY, {
      id: interviews[interviews.length - 1].post_interview_reminder_id,
      candidate_id: DEFAULT_CANDIDATE_ID,
      interview_id: interviews[interviews.length - 1].id,
      type: InterviewReminder.TYPES.POST_INTERVIEW,
      date_time_moment: moment.tz('2022-03-14T17:00', 'US-America/Chicago'),
      is_enabled: false
    })
  ],
  addInterview('upcoming-interview-2__interview--past-1', {
    id: 'globo-gym-interview-past-1-uuid',
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Thu Feb 18 at 9:00AM CST
    date_time_moment: moment.tz('2016-02-18T09:00', 'US-America/Chicago'),
    details: '',
    pre_interview_reminder_id: 'globo-gym-reminder-pre-int-pa-1',
    post_interview_reminder_id: 'globo-gym-reminder-post-int-pa-1'
  }),
  addInterviewReminder('upcoming-interview-2__reminder--pre-interview--past-1', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2016-02-18T06:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterviewReminder('upcoming-interview-2__reminder--post-interview--past-1', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment: moment.tz('2016-02-18T12:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterview('upcoming-interview-2__interview--past-2', {
    id: 'globo-gym-interview-past-2-uuid',
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Wed Mar 2 at 6:00PM CST
    date_time_moment: moment.tz('2016-03-02T18:00', 'US-America/Chicago'),
    details: '',
    pre_interview_reminder_id: 'globo-gym-reminder-pre-int-pa-2',
    post_interview_reminder_id: 'globo-gym-reminder-post-int-pa-2'
  }),
  addInterviewReminder('upcoming-interview-2__reminder--pre-interview--past-2', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2016-03-02T15:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterviewReminder('upcoming-interview-2__reminder--post-interview--past-2', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment: moment.tz('2016-03-02T21:00', 'US-America/Chicago'),
    is_enabled: false
  })
];
exports.APPLICATION_UPCOMING_INTERVIEW_3 = exports.APPLICATION_MULTIPLE_UPCOMING_INTERVIEWS =
    exports.APPLICATION_STARK_INDUSTRIES = [
  addApplication('upcoming-interview-3__application', {
    id: 'abcdef-stark-indy-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Mon Feb 1
    application_date_moment: moment('2016-03-01'),
    archived_at_moment: null,
    company_name: '',
    name: 'Stark Industries',
    notes: 'Developing high tech exoskeletons',
    posting_url: 'http://job-openings.monster.com/monster/abcdef-ghij-klmn-opqr-stuvwxyz',
    status: Application.STATUSES.UPCOMING_INTERVIEW
  }),
  addInterview('upcoming-interview-3__interview--upcoming-1', {
    id: 'stark-indy-interview-upcoming-1-uuid',
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Mon Mar 14 at 2:00PM CST
    date_time_moment: moment.tz('2022-03-14T14:00', 'US-America/Chicago'),
    details: '',
    pre_interview_reminder_id: 'stark-indy-reminder-pre-int-up-1',
    post_interview_reminder_id: 'stark-indy-reminder-post-int-up-1'
  }),
  addInterviewReminder('upcoming-interview-3__reminder--pre-interview--upcoming-1', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2022-03-14T11:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterviewReminder('upcoming-interview-3__reminder--post-interview--upcoming-1', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment: moment.tz('2022-03-14T17:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterview('upcoming-interview-3__interview--upcoming-2', {
    id: 'stark-indy-interview-upcoming-2-uuid',
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Mon Mar 14 at 2:00PM CST
    date_time_moment: moment.tz('2022-03-22T07:00', 'US-America/Chicago'),
    details: '',
    pre_interview_reminder_id: 'stark-indy-reminder-pre-int-up-2',
    post_interview_reminder_id: 'stark-indy-reminder-post-int-up-2'
  }),
  addInterviewReminder('upcoming-interview-3__reminder--pre-interview--upcoming-2', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2022-03-22T09:00', 'US-America/Chicago'),
    is_enabled: false
  }),
  addInterviewReminder('upcoming-interview-3__reminder--post-interview--upcoming-2', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment: moment.tz('2022-03-22T11:00', 'US-America/Chicago'),
    is_enabled: false
  })
];

// Waiting for response applications
exports.APPLICATION_WAITING_FOR_RESPONSE_KEY = 'waiting-for-response__application';
exports.INTERVIEW_WAITING_FOR_RESPONSE_KEY = 'waiting-for-response__interview';
exports.REMINDER_WAITING_FOR_RESPONSE_KEY = 'waiting-for-response__reminder--application';
exports.APPLICATION_WAITING_FOR_RESPONSE = exports.APPLICATION_WAITING_FOR_RESPONSE_WITH_PAST_INTERVIEWS =
    exports.APPLICATION_SKY_NETWORKS = [
  exports.APPLICATION_WAITING_FOR_RESPONSE_NO_PAST_INTERVIEWS = [
    addApplication(exports.APPLICATION_WAITING_FOR_RESPONSE_KEY, {
      id: 'abcdef-sky-networks-uuid',
      candidate_id: DEFAULT_CANDIDATE_ID,
      // Fri Jan 8
      application_date_moment: moment('2016-01-08'),
      archived_at_moment: null,
      company_name: 'Sky Networks Inc',
      // Mon Jan 25
      waiting_for_response_reminder_id: 'abcdef-sky-networks-reminder-uuid',
      posting_url: 'https://github.com/about/jobs',
      name: 'Sky Networks',
      notes: 'Phone screen (John): 100 employees, focused on AI<br/>' +
        'Website: <a href="https://sky.net/">https://sky.net/</a>',
      status: Application.STATUSES.WAITING_FOR_RESPONSE
    }),
    exports.REMINDER_WAITING_FOR_RESPONSE = [
      addApplicationReminder(exports.REMINDER_WAITING_FOR_RESPONSE_KEY, {
        id: applications[applications.length - 1].waiting_for_response_reminder_id,
        candidate_id: DEFAULT_CANDIDATE_ID,
        application_id: applications[applications.length - 1].id,
        type: ApplicationReminder.TYPES.WAITING_FOR_RESPONSE,
        date_time_moment: moment.tz('2016-01-25T12:00', 'US-America/Chicago'),
        is_enabled: true
      })
    ]
  ],
  addInterview(exports.INTERVIEW_WAITING_FOR_RESPONSE_KEY, {
    id: 'abcdef-sky-networks-interview-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    application_id: applications[applications.length - 1].id,
    // Fri Jan 15 at 9:00AM PST
    date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Los_Angeles'),
    details: 'Call 555-123-4567',
    pre_interview_reminder_id: 'sky-networks-reminder-pre-int-uuid',
    post_interview_reminder_id: 'sky-networks-reminder-post-int-uuid'
  }),
  addInterviewReminder('waiting-for-response__reminder--pre-interview', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2016-01-15T08:00', 'US-America/Los_Angeles'),
    is_enabled: true
  }),
  addInterviewReminder('waiting-for-response__reminder--post-interview', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment:  moment.tz('2016-01-15T11:00', 'US-America/Los_Angeles'),
    is_enabled: true
  })
];

// Saved for later applications
exports.APPLICATION_SAVED_FOR_LATER_KEY = 'saved-for-later__application';
exports.REMINDER_SAVED_FOR_LATER_KEY = 'saved-for-later__reminder--application';
exports.APPLICATION_SAVED_FOR_LATER = exports.APPLICATION_INTERTRODE = [
  addApplication(exports.APPLICATION_SAVED_FOR_LATER_KEY, {
    id: 'abcdef-intertrode-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    application_date_moment: null,
    archived_at_moment: null,
    created_at: moment.tz('2015-12-19T12:00', 'US-America/Chicago').toDate(),
    company_name: 'Intertrode Inc',
    name: 'Intertrode',
    // Mon Jan 25
    saved_for_later_reminder_id: 'abcdef-intertrode-reminder-uuid',
    notes: 'Website: http://intertrode.net/',
    posting_url: 'https://www.dice.com/jobs/detail/Business-Systems-Analyst-Springfield-USA-12345/1234567/123456',
    status: Application.STATUSES.SAVED_FOR_LATER
  }),
  addApplicationReminder(exports.REMINDER_SAVED_FOR_LATER_KEY, {
    id: applications[applications.length - 1].saved_for_later_reminder_id,
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    type: ApplicationReminder.TYPES.SAVED_FOR_LATER,
    date_time_moment: moment.tz('2016-06-20T12:00', 'US-America/Chicago'),
    is_enabled: true
  })
];

// Archived applications
exports.APPLICATION_ARCHIVED_KEY = 'archived__application';
exports.REMINDER_ARCHIVED_KEY = 'archived__reminder--application';
exports.APPLICATION_ARCHIVED = exports.APPLICATION_MONSTROMART = [
  addApplication(exports.APPLICATION_ARCHIVED_KEY, {
    id: 'abcdef-monstromart-uuid',
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Fri Jan 8
    application_date_moment: moment('2016-01-08'),
    // Mon Jan 18 at 3:00PM CST
    // DEV: Technically this is stored as timezone-less but we re-render with user's timezone
    archived_at_moment: moment.tz('2016-01-18T15:00', 'US-America/Chicago'),
    waiting_for_response_reminder_id: 'abcdef-monstromart-reminder-uuid',
    company_name: 'Monstromart Inc',
    status: Application.STATUSES.ARCHIVED,
    posting_url: 'https://github.com/about/jobs',
    name: 'Monstromart',
    notes: 'Sounds like a great career opportunity'
  }),
  addApplicationReminder(exports.REMINDER_ARCHIVED_KEY, {
    id: applications[applications.length - 1].waiting_for_response_reminder_id,
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    type: ApplicationReminder.TYPES.WAITING_FOR_RESPONSE,
    date_time_moment: moment.tz('2016-03-20T19:00', 'US-America/Chicago'),
    is_enabled: true
  }),
  addInterview('archived__interview', {
    id: 'abcdef-monstromart-interview-uuid',
    application_id: applications[applications.length - 1].id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    // Fri Jan 15 at 9:00AM PST
    date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Los_Angeles'),
    details: 'Wait for call from Bob',
    pre_interview_reminder_id: 'monstromart-reminder-pre-int-uuid',
    post_interview_reminder_id: 'monstromart-reminder-post-int-uuid'
  }),
  addInterviewReminder('archived__reminder--pre-interview', {
    id: interviews[interviews.length - 1].pre_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.PRE_INTERVIEW,
    date_time_moment: moment.tz('2016-01-15T08:00', 'US-America/Los_Angeles'),
    is_enabled: true
  }),
  addInterviewReminder('archived__reminder--post-interview', {
    id: interviews[interviews.length - 1].post_interview_reminder_id,
    candidate_id: DEFAULT_CANDIDATE_ID,
    interview_id: interviews[interviews.length - 1].id,
    type: InterviewReminder.TYPES.POST_INTERVIEW,
    date_time_moment:  moment.tz('2016-01-15T11:00', 'US-America/Los_Angeles'),
    is_enabled: true
  })
];

// Overridden fixtures
function overrideFixtures(baseArr/*, overrideFixtures...*/) {
  // Normalize our base array to use `{key, overrides, overrideDataValues}` syntax
  var retArr = baseArr.map(function normalizeBaseVal (obj) {
    assert(obj);
    return typeof obj === 'object' ? obj : {key: obj};
  });
  var overrideFixtures = slice.call(arguments, 1);

  // For each of our override objects
  var fixtureOverrides = {};
  overrideFixtures.forEach(function handleOverrideObj (overriddenFixture, i) {
    // Resolve our base fixture's key
    assert(overriddenFixture.base, 'Expected "' + JSON.stringify(overriddenFixture) + '" ' +
      '(override #' + (i + 1) + ') to have "base" key but it didn\'t');
    var fixtureKey = typeof overriddenFixture.base === 'string' ? overriddenFixture.base : overriddenFixture.base.key;
    assert(fixtureKey, 'Unable to resolve fixture key for "' + JSON.stringify(overriddenFixture) + '" ' +
      '(override #' + (i + 1) + ')');
    assert.strictEqual(fixtureOverrides[fixtureKey], undefined,
      'Multiple overrides requested for same key "' + fixtureKey + '". ' +
      'Please only override once per `overrideFixtures` call');
    fixtureOverrides[fixtureKey] = true;

    // Find our base fixture
    var index = _.findIndex(retArr, {key: fixtureKey});
    assert.notEqual(index, -1, 'Unable to find fixture "' + fixtureKey + '" in fixtures being overridden');
    var baseFixture = retArr[index];

    // Perform our overrides and swap our value
    // DEV: This mutates the override fixture so further objects inherit from its overrides
    overriddenFixture.key = baseFixture.key;
    overriddenFixture.overrides = _.extend({}, baseFixture.overrides,
      overriddenFixture.overrides);
    overriddenFixture.overrideDataValues = _.extend({}, baseFixture.overrideDataValues,
      overriddenFixture.overrideDataValues);
    overriddenFixture.skip = _.union({}, baseFixture.skip,
      overriddenFixture.skip);
    retArr.splice(index, 1, overriddenFixture);
  });

  // Return our modified array
  return retArr;
}
exports.APPLICATION_RECEIVED_OFFER_WITH_UPCOMING_INTERVIEW = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER,
    exports.INTERVIEW_UPCOMING_INTERVIEW
  ]),
  {
    // interview = {id: umbrella-corp, application_id: black-mesa}
    base: exports.INTERVIEW_UPCOMING_INTERVIEW_KEY,
    overrides: {application_id: 'abcdef-black-mesa-uuid'}
  }
);

exports.APPLICATION_RECEIVED_OFFER_EMPTY = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER
  ]),
  {
    base: exports.APPLICATION_RECEIVED_OFFER_KEY,
    overrides: {notes: '', posting_url: ''}
  },
  {
    base: exports.REMINDER_RECEIVED_OFFER_KEY,
    overrides: {is_enabled: false}
  }
);

exports.APPLICATION_UPCOMING_INTERVIEW_FULL = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW
  ]),
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY,
    overrides: {is_enabled: true}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_KEY,
    overrides: {is_enabled: true}
  }
);

exports.APPLICATION_UPCOMING_INTERVIEW_EMPTY = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW
  ]),
  {
    base: exports.APPLICATION_UPCOMING_INTERVIEW_KEY,
    overrides: {notes: '', posting_url: ''}
  },
  {
    base: exports.INTERVIEW_UPCOMING_INTERVIEW_KEY,
    overrides: {details: ''}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY,
    overrides: {is_enabled: false}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_KEY,
    overrides: {is_enabled: false}
  }
);

exports.APPLICATION_WAITING_FOR_RESPONSE_EMPTY = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE
  ]),
  {
    base: exports.APPLICATION_WAITING_FOR_RESPONSE_KEY,
    overrides: {notes: '', posting_url: ''}
  },
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_KEY,
    overrides: {is_enabled: false}
  }
);

exports.APPLICATION_SAVED_FOR_LATER_EMPTY = overrideFixtures(
  _.flatten([
    exports.APPLICATION_SAVED_FOR_LATER
  ]),
  {
    base: exports.APPLICATION_SAVED_FOR_LATER_KEY,
    overrides: {notes: '', posting_url: ''}
  },
  {
    base: exports.REMINDER_SAVED_FOR_LATER_KEY,
    overrides: {is_enabled: false}
  }
);

exports.APPLICATION_ARCHIVED_EMPTY = overrideFixtures(
  _.flatten([
    exports.APPLICATION_ARCHIVED
  ]),
  {
    base: exports.APPLICATION_ARCHIVED_KEY,
    overrides: {notes: '', posting_url: ''}
  },
  {
    base: exports.REMINDER_ARCHIVED_KEY,
    overrides: {is_enabled: false}
  }
);

// GROUP: Due with matching status
exports.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_SAVED_FOR_LATER
  ]),
  exports.REMINDER_SAVED_FOR_LATER_REMINDER_DUE = {
    base: exports.REMINDER_SAVED_FOR_LATER_KEY,
    overrides: {date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Chicago')}
  }
);
exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE
  ]),
  exports.REMINDER_WAITING_FOR_RESPONSE_REMINDER_DUE = {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_KEY,
    overrides: {date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Chicago')}
  }
);
exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW
  ]),
  exports.INTERVIEW_UPCOMING_INTERVIEW_REMINDER_DUE = {
    base: exports.INTERVIEW_UPCOMING_INTERVIEW_KEY,
    overrides: {date_time_moment: moment.tz('2016-01-15T11:00', 'US-America/Chicago')},
    overrideDataValues: {
      type: Interview.TYPES.UPCOMING_INTERVIEW,
      can_send_reminders: true
    },
    skip: ['typeMatchesDateTime']
  },
  exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_REMINDER_DUE = {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY,
    overrides: {
      date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Chicago'),
      is_enabled: true
    }
  },
  exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_REMINDER_DUE = {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_KEY,
    overrides: {
      date_time_moment: moment.tz('2016-01-15T13:00', 'US-America/Chicago'),
      is_enabled: true
    }
  }
);
exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER
  ]),
  exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE = {
    base: exports.REMINDER_RECEIVED_OFFER_KEY,
    overrides: {date_time_moment: moment.tz('2016-01-15T09:00', 'US-America/Chicago')}
  }
);

// GROUP: Due yet unsendable
exports.APPLICATION_RECEIVED_OFFER_WITH_INTERVIEW_REMINDERS_DUE_YET_UNSENDABLE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE,
    exports.REMINDER_RECEIVED_OFFER_KEY
  ]),
  {
    // application = {id: 'umbrella-corp', status: 'received_offer', reminder: 'black-mesa'}
    base: exports.APPLICATION_UPCOMING_INTERVIEW_KEY,
    overrides: {status: 'received_offer', received_offer_reminder_id: 'abcdef-black-mesa-reminder-uuid'}
  },
  {
    base: exports.INTERVIEW_UPCOMING_INTERVIEW_REMINDER_DUE,
    overrideDataValues: {
      type: Interview.TYPES.PAST_INTERVIEW,
      can_send_reminders: false
    }
  },
  {
    // reminder = {id: 'black-mesa', application_id: 'umbrella-corp', is_enabled: false}
    base: exports.REMINDER_RECEIVED_OFFER_KEY,
    overrides: {application_id: 'abcdef-umbrella-corp-uuid', is_enabled: false}
  }
);

// GROUP: Due with mismatched status
exports.APPLICATION_WAITING_FOR_RESPONSE_WITH_SAVED_FOR_LATER_REMINDER_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE,
    exports.REMINDER_SAVED_FOR_LATER_KEY
  ]),
  {
    // application = {id: 'sky-networks', reminder: 'intertrode'}
    base: exports.APPLICATION_WAITING_FOR_RESPONSE_KEY,
    overrides: {saved_for_later_reminder_id: 'abcdef-intertrode-reminder-uuid'}
  },
  {
    // reminder = {id: 'intertrode', application_id: 'sky-networks'}
    base: exports.REMINDER_SAVED_FOR_LATER_REMINDER_DUE,
    overrides: {application_id: 'abcdef-sky-networks-uuid'}
  },
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_KEY,
    overrides: {is_enabled: false}
  }
);
exports.APPLICATION_WAITING_FOR_RESPONSE_WITH_RECEIVED_OFFER_REMINDER_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE,
    exports.REMINDER_RECEIVED_OFFER_KEY
  ]),
  {
    // application = {id: 'sky-networks', reminder: 'black-mesa'}
    base: exports.APPLICATION_WAITING_FOR_RESPONSE_KEY,
    overrides: {received_offer_reminder_id: 'abcdef-black-mesa-reminder-uuid'}
  },
  {
    // reminder = {id: 'black-mesa', application_id: 'sky-networks'}
    base: exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE,
    overrides: {application_id: 'abcdef-sky-networks-uuid'}
  },
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_KEY,
    overrides: {is_enabled: false}
  }
);
exports.APPLICATION_RECEIVED_OFFER_WITH_WAITING_FOR_RESPONSE_REMINDER_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER,
    exports.REMINDER_WAITING_FOR_RESPONSE_KEY
  ]),
  {
    // application = {id: 'black-mesa', reminder: 'sky-networks'}
    base: exports.APPLICATION_RECEIVED_OFFER_KEY,
    overrides: {waiting_for_response_reminder_id: 'abcdef-sky-networks-reminder-uuid'}
  },
  {
    // reminder = {id: 'sky-networks', application_id: 'black-mesa'}
    base: exports.REMINDER_WAITING_FOR_RESPONSE_REMINDER_DUE,
    overrides: {application_id: 'abcdef-black-mesa-uuid'}
  },
  {
    base: exports.REMINDER_RECEIVED_OFFER_KEY,
    overrides: {is_enabled: false}
  }
);
exports.APPLICATION_ARCHIVED_WITH_INTERVIEW_REMINDERS_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE
  ]),
  {
    base: exports.APPLICATION_UPCOMING_INTERVIEW_KEY,
    overrides: {status: 'archived', archived_at_moment: moment('2016-02-01T11:00:00')}
  }
);

// GROUP: Due yet disabled
exports.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE_YET_DISABLED = overrideFixtures(
  _.flatten([
    exports.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_SAVED_FOR_LATER_REMINDER_DUE,
    overrides: {is_enabled: false}
  }
);
exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_YET_DISABLED = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_REMINDER_DUE,
    overrides: {is_enabled: false}
  }
);
exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE_YET_DISABLED = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE
  ]),
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_REMINDER_DUE,
    overrides: {is_enabled: false}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_REMINDER_DUE,
    overrides: {is_enabled: false}
  }
);
exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE_YET_DISABLED = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE,
    overrides: {is_enabled: false}
  }
);

// GROUP: Due yet sent
exports.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE_YET_SENT = overrideFixtures(
  _.flatten([
    exports.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_SAVED_FOR_LATER_REMINDER_DUE,
    overrides: {sent_at_moment: moment('2016-01-15T09:30')}
  }
);
exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_YET_SENT = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_REMINDER_DUE,
    overrides: {sent_at_moment: moment('2016-01-15T09:30')}
  }
);
exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE_YET_SENT = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE
  ]),
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_REMINDER_DUE,
    overrides: {sent_at_moment: moment('2016-01-15T14:30')}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_REMINDER_DUE,
    overrides: {sent_at_moment: moment('2016-01-15T14:30')}
  }
);
exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE_YET_SENT = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE,
    overrides: {sent_at_moment: moment('2016-01-15T09:30')}
  }
);

// GROUP: Not due
exports.APPLICATION_SAVED_FOR_LATER_REMINDER_NOT_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_SAVED_FOR_LATER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_SAVED_FOR_LATER_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-01T09:00', 'US-America/Chicago')}
  }
);
exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_NOT_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-01T09:00', 'US-America/Chicago')}
  }
);
exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_NOT_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE
  ]),
  {
    base: exports.INTERVIEW_UPCOMING_INTERVIEW_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-01T11:00', 'US-America/Chicago')}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-01T09:00', 'US-America/Chicago')}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-01T14:00', 'US-America/Chicago')}
  }
);
exports.APPLICATION_RECEIVED_OFFER_REMINDER_NOT_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-01T09:00', 'US-America/Chicago')}
  }
);

// NO MORE GROUPS
exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_DUE_2 = overrideFixtures(
  _.flatten([
    exports.APPLICATION_RECEIVED_OFFER_REMINDER_DUE
  ]),
  {
    base: exports.APPLICATION_RECEIVED_OFFER_KEY,
    overrides: {
      status: Application.STATUSES.WAITING_FOR_RESPONSE,
      waiting_for_response_reminder_id: 'abcdef-black-mesa-reminder-uuid',
      received_offer_reminder_id: null
    }
  },
  {
    base: exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE,
    overrides: {type: ApplicationReminder.TYPES.WAITING_FOR_RESPONSE}
  }
);

exports.APPLICATION_SPLIT_UPCOMING_INTERVIEWS = overrideFixtures(
  _.flatten([
    exports.APPLICATION_UPCOMING_INTERVIEW_REMINDERS_DUE,
    exports.INTERVIEW_UPCOMING_INTERVIEW_2_UPCOMING
  ]),
  exports.INTERIVEW_SPLIT_UPCOMING_INTERVIEWS_2 = {
    // interview = {id: 'globo-gym', application_id: 'umbrella-corp'}
    base: exports.INTERVIEW_UPCOMING_INTERVIEW_2_UPCOMING_KEY,
    overrides: {application_id: 'abcdef-umbrella-corp-uuid'}
  }
);

exports.APPLICATION_MULTIPLE_UPCOMING_INTERVIEWS_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_SPLIT_UPCOMING_INTERVIEWS
  ]),
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_PRE_INTERVIEW_KEY,
    overrides: {is_enabled: false}
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_POST_INTERVIEW_KEY,
    overrides: {is_enabled: false}
  },
  {
    base: exports.INTERIVEW_SPLIT_UPCOMING_INTERVIEWS_2,
    overrides: {date_time_moment: moment.tz('2016-02-20T11:00', 'US-America/Chicago')},
    overrideDataValues: {
      type: Interview.TYPES.UPCOMING_INTERVIEW,
      can_send_reminders: true
    },
    skip: ['typeMatchesDateTime']
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_2_UPCOMING_PRE_INTERVIEW_KEY,
    overrides: {
      date_time_moment: moment.tz('2016-02-20T09:00', 'US-America/Chicago'),
      is_enabled: false
    }
  },
  {
    base: exports.REMINDER_UPCOMING_INTERVIEW_2_UPCOMING_POST_INTERVIEW_KEY,
    overrides: {
      date_time_moment: moment.tz('2016-02-20T13:00', 'US-America/Chicago'),
      is_enabled: false
    }
  }
);

exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_OLD_YET_NOT_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE_REMINDER_NOT_DUE
  ]),
  {
    base: exports.REMINDER_WAITING_FOR_RESPONSE_REMINDER_DUE,
    overrideDataValues: {updated_at: new Date('2016-03-03T15:00:00.000Z')}
  }
);

exports.APPLICATION_WAITING_FOR_RESPONSE_WITH_RECEIVED_OFFER_REMINDER_NOT_DUE = overrideFixtures(
  _.flatten([
    exports.APPLICATION_WAITING_FOR_RESPONSE_WITH_RECEIVED_OFFER_REMINDER_DUE
  ]),
  {
    base: exports.REMINDER_RECEIVED_OFFER_REMINDER_DUE,
    overrides: {date_time_moment: moment.tz('2022-12-09T03:00', 'US-America/Chicago')}
  }
);
