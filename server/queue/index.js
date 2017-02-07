// Load in our dependencies
var assert = require('assert');
var domain = require('domain');
var _ = require('underscore');
var async = require('async');
var moment = require('moment-timezone');
// DEV: We load `app` before `saveModelsViaQueue` to prevent order issues
var app = require('../index.js').app;
var kueQueue = require('../index.js').app.kueQueue;
var getExternalUrl = require('../index.js').getExternalUrl;
var Application = require('../models/application');
var ApplicationReminder = require('../models/application-reminder');
var Candidate = require('../models/candidate');
var includes = require('../models/utils/includes');
var Interview = require('../models/interview');
var InterviewReminder = require('../models/interview-reminder');
var emails = require('../emails');
var sentryClient = exports.sentryClient = app.sentryClient;
var saveModelsViaQueue = require('../models/utils/save-models').saveModelsViaQueue;

// If we are in a Kue environment, enable cleanup
// https://github.com/Automattic/kue/tree/v0.11.5#unstable-redis-connections
var isKue = process.env.KUE === '1';
if (isKue) {
  kueQueue.watchStuckJobs();
}

// Define queue registration helper
var JOBS = exports.JOBS = {};
function getSentryKwargsForJob(job) {
  // https://docs.sentry.io/clientdev/attributes/
  return {
    extra: {
      // Example: sendTestEmail
      jobType: job.type,
      // Example: {to: 'todd@findwork.co'}
      jobData: job.data,
      // Example: 17
      jobId: job.id
    }
  };
}
function registerJob(name, concurrency, fn) {
  // If we are in a queue process, then register our processor
  // https://github.com/Automattic/kue/tree/v0.11.5#processing-jobs
  if (isKue) {
    kueQueue.process(name, concurrency, function processFn (job, done) {
      // Wrap our function in a domain to catch sync/async errors
      // https://github.com/Automattic/kue/tree/v0.11.5#prevent-from-stuck-active-jobs
      var that = this;
      var jobDomain = domain.create();

      // When we encounter an error
      // DEV: We could use `queue.on('job failed')` but errors were converted to strings (i.e. no stacktrace)
      //   This is due to using Redis pub/sub
      jobDomain.on('error', function handleError (err) {
        // Report/log our error
        // DEV: We could throw errors in testing but they won't be caught due to being async
        app.notWinston.error(err);
        sentryClient.captureError(err, getSentryKwargsForJob(job));

        // Callback with our error
        done(err);
      });
      jobDomain.run(function callFn () {
        fn.call(that, job, function handleDone (err) {
          // If there was an error, log it
          if (err) {
            app.notWinston.error(err);
            sentryClient.captureError(err, getSentryKwargsForJob(job));
          }

          // Callback with error
          done(err);
        });
      });
    });
  }
}

// Define an helper for `queue.create` that auto-cleans itself
exports.create = function () {
  // Generate our job
  var job = kueQueue.create.apply(kueQueue, arguments);

  // Define a default TTL to prevent our task from persisting perminently
  // DEV: Running `ttl` again will overwrite this value
  // DEV: This guarantees jobs won't be considered active on server restart
  // https://github.com/Automattic/kue/tree/v0.11.5#job-ttl
  job.ttl(60 * 1000); // 1 minute

  // Set up clean up bindings
  // DEV: We could use `removeOnComplete` but we always want to clean our job on failure/completion
  //   `removeOnComplete` only handles success
  // https://github.com/Automattic/kue/tree/v0.11.5#job-events
  // https://github.com/Automattic/kue/tree/v0.11.5#job-cleanup
  function cleanupJob() {
    job.remove(function handleRemove (err) {
      // If there was an error, record it
      if (err) {
        app.notWinston.error(err);
        sentryClient.captureError(err, getSentryKwargsForJob(job));
      }
    });
  }
  job.on('complete', cleanupJob);
  job.on('failed', cleanupJob);

  // Return our job
  return job;
};

// Define our jobs
// https://github.com/Automattic/kue/tree/v0.11.5#processing-jobs
JOBS.SEND_TEST_EMAIL = 'sendTestEmail';
registerJob(JOBS.SEND_TEST_EMAIL, 2, function sendTestEmail (job, done) {
  assert(job.data.to);
  emails.test({
    to: job.data.to
  }, {
    url: 'welcome.com/queue'
  }, done);
});

JOBS.GENERATE_FAILURE_ERROR = 'generateFailureError';
registerJob(JOBS.GENERATE_FAILURE_ERROR, 1, function generateFailureErrorFn (job, done) {
  process.nextTick(function handleNextTick () {
    done(new Error('Failure error'));
  });
});

JOBS.GENERATE_SYNC_ERROR = 'generateSyncError';
registerJob(JOBS.GENERATE_SYNC_ERROR, 1, function generateSyncErrorFn (job, done) {
  throw new Error('Synchronous error');
});

JOBS.GENERATE_ASYNC_ERROR = 'generateAsyncError';
registerJob(JOBS.GENERATE_ASYNC_ERROR, 1, function generateAsyncErrorFn (job, done) {
  process.nextTick(function handleNextTick () {
    throw new Error('Asynchronous error');
  });
});

JOBS.SEND_WELCOME_EMAIL = 'sendWelcomeEmail';
registerJob(JOBS.SEND_WELCOME_EMAIL, 5, function sendWelcomeEmail (job, done) {
  // Resolve our candidate by their id
  assert(job.data.candidateId);
  Candidate.findById(job.data.candidateId).asCallback(function handleGet (err, candidate) {
    // If there was an error, callback with it
    if (err) {
      return done(err);
    }

    // If we have sent a welcome email already, then bail out
    // DEV: We use an attribute to prevent repeat emails due to job queues not being idempotent
    if (candidate.get('welcome_email_sent')) {
      return done(null);
    }

    // Otherwise, send our welcome email
    emails.welcome({
      to: candidate.get('email')
    }, {
      add_application_url: getExternalUrl('/add-application'),
      email: candidate.get('email')
    }, function handleSend (err) {
      // If there was an error, callback with it
      if (err) { return done(err); }

      // Update our candidate with a `welcome_email_sent` attribute
      candidate.set('welcome_email_sent', true);
      saveModelsViaQueue({models: [candidate]}, done);
    });
  });
});

// DEV: We only process 1 set of reminders at a time to prevent double sending
// DEV: We could use a main job which counts/queues other jobs with offsets (e.g. by id)
//   However that has its own complexities (e.g. can't use numeric offsets due to potentially double send of tail/head)
//   Work around would split UUID range but that adds more complexity as mentioned
//   https://gist.github.com/twolfson/6751d2a1a529eceec604a5c1c7f62668
JOBS.PROCESS_REMINDERS = 'processReminders';
exports.PROCESS_REMINDERS_FREQUENCY = 60 * 1000; // 1 minute
exports.PROCESS_REMINDERS_BATCH_SIZE = 100;
exports._triggerProcessReminders = function () {
  return exports.create(JOBS.PROCESS_REMINDERS)
    .ttl(exports.PROCESS_REMINDERS_FREQUENCY)
    .save();
};
exports.loopGuaranteeProcessReminders = function () {
  // Guarantee our reminder queue has at least 1 job in it
  var guaranteeReminderQueueNotEmpty = function () {
    // https://github.com/Automattic/kue/tree/v0.11.5#queue-maintenance
    // https://github.com/Automattic/kue/blob/v0.11.5/lib/kue.js#L615-L661
    async.parallel([
      kueQueue.inactiveCount.bind(kueQueue, JOBS.PROCESS_REMINDERS),
      kueQueue.activeCount.bind(kueQueue, JOBS.PROCESS_REMINDERS)
    ], function handleCounts (err, results) {
      // If there was an error, log it
      // DEV: We intentionally don't return so we keep on looping
      if (err) {
        app.notWinston.error(err);
        app.sentryClient.captureError(err);
      // Otherwise
      } else {
        // If we have nothing in progress and nothing queued, add a new task to our queue
        var totalCount = results[0] + results[1];
        if (totalCount === 0) {
          exports._triggerProcessReminders();
        }
      }

      // Start our check again in a bit
      setTimeout(guaranteeReminderQueueNotEmpty, exports.PROCESS_REMINDERS_FREQUENCY);
    });
  };
  setTimeout(guaranteeReminderQueueNotEmpty, exports.PROCESS_REMINDERS_FREQUENCY);
};
function markReminderAsSent(reminder, cb) {
  reminder.set('sent_at_moment', moment());
  saveModelsViaQueue({models: [reminder]}, cb);
}
function handleApplicationInterviews(application) {
  var modelsToSave = [application];
  application.get('upcoming_interviews').forEach(function updateUpcomingInterview (interview) {
    // If the interview is due, then update its type and save it
    if (interview.get('date_time_moment') <= moment()) {
      interview.updateType();
      modelsToSave.push(interview);
      interview.setDataValue('application', application);
    }
  });
  modelsToSave = _.union(modelsToSave,
    application.updateToInterviewChanges(application.get('candidate')));
  return modelsToSave;
}
function logError(err, job, cb) {
  // Report/log our error
  app.notWinston.error(err);
  sentryClient.captureError(err, getSentryKwargsForJob(job));

  // Callback with nothing as we don't want to halt batch processing
  cb(null);
}
registerJob(JOBS.PROCESS_REMINDERS, 1, function processReminders (job, done) {
  // Define our queries for reuse
  // DEV: We define queries in a function so it gets dynamic exports changes during testing
  var whereReminerDue = {
    date_time_datetime: {$lte: new Date()},
    is_enabled: true,
    sent_at_datetime: null
  };
  var savedForLaterQuery = {
    where: {
      status: Application.STATUSES.SAVED_FOR_LATER
    },
    include: [{
      model: Candidate
    }, {
      model: ApplicationReminder,
      as: 'saved_for_later_reminder',
      where: whereReminerDue
    }],
    limit: exports.PROCESS_REMINDERS_BATCH_SIZE
  };
  var waitingForResponseQuery = {
    where: {
      status: Application.STATUSES.WAITING_FOR_RESPONSE
    },
    include: [{
      model: Candidate
    }, {
      model: ApplicationReminder,
      as: 'waiting_for_response_reminder',
      where: whereReminerDue
    }],
    limit: exports.PROCESS_REMINDERS_BATCH_SIZE
  };
  var preInterviewQuery = {
    where: {
      can_send_reminders: true
    },
    include: [{
      model: Candidate
    }, {
      model: Application,
      where: {
        // Allow any active applications to get reminders for their interviews (e.g. received offer)
        status: {$not: Application.STATUSES.ARCHIVED}
      }
    }, {
      model: InterviewReminder,
      as: 'pre_interview_reminder',
      where: whereReminerDue
    }, {
      model: InterviewReminder,
      as: 'post_interview_reminder'
    }],
    limit: exports.PROCESS_REMINDERS_BATCH_SIZE
  };
  var postInterviewQuery = {
    where: {
      can_send_reminders: true
    },
    include: [{
      model: Candidate
    }, {
      model: Application,
      // DEV: We reuse application include so we can detect what the changes will be for our email
      include: includes.updateInterviewApplication,
      where: {
        // Allow any active applications to get reminders for their interviews (e.g. received offer)
        status: {$not: Application.STATUSES.ARCHIVED}
      }
    }, {
      model: InterviewReminder,
      as: 'post_interview_reminder',
      where: whereReminerDue
    }],
    limit: exports.PROCESS_REMINDERS_BATCH_SIZE
  };
  var receivedOfferQuery = {
    where: {
      status: Application.STATUSES.RECEIVED_OFFER
    },
    include: [{
      model: Candidate
    }, {
      model: ApplicationReminder,
      as: 'received_offer_reminder',
      where: whereReminerDue
    }],
    limit: exports.PROCESS_REMINDERS_BATCH_SIZE
  };

  // In parallel
  async.parallel([
    function updateSavedForLaterReminders (callback) {
      Application.findAll(savedForLaterQuery).asCallback(function handleFindAll (err, applications) {
        // If there was an error, callback with it
        if (err) {
          return logError(err, job, callback);
        }

        // For each of our applications
        async.forEach(applications, function handleApplication (application, cb) {
          var candidate = application.get('candidate');
          emails.savedForLaterReminder({
            to: candidate.get('email')
          }, {
            application: application.get({plain: true}),
            email: candidate.get('email')
          }, function handleSend (err) {
            // If there was an error, callback with it
            if (err) { return logError(err, job, cb); }

            // Update our model
            var reminder = application.get('saved_for_later_reminder');
            markReminderAsSent(reminder, cb);
          });
        }, callback);
      });
    },
    function updateWaitingForResponseReminders (callback) {
      Application.findAll(waitingForResponseQuery).asCallback(function handleFindAll (err, applications) {
        if (err) { return logError(err, job, callback); }
        async.forEach(applications, function handleApplication (application, cb) {
          var candidate = application.get('candidate');
          emails.waitingForResponseReminder({
            to: candidate.get('email')
          }, {
            application: application.get({plain: true}),
            email: candidate.get('email')
          }, function handleSend (err) {
            if (err) { return logError(err, job, cb); }
            var reminder = application.get('waiting_for_response_reminder');
            markReminderAsSent(reminder, cb);
          });
        }, callback);
      });
    },
    function updatePreInterviewReminders (callback) {
      Interview.findAll(preInterviewQuery).asCallback(function handleFindAll (err, interviews) {
        if (err) {
          return logError(err, job, callback);
        }
        async.forEach(interviews, function handleInterview (interview, cb) {
          var candidate = interview.get('candidate');
          emails.preInterviewReminder({
            to: candidate.get('email')
          }, {
            interview: interview.get({plain: true}),
            application: interview.get('application').get({plain: true}),
            email: candidate.get('email')
          }, function handleSend (err) {
            if (err) { return logError(err, job, cb); }
            var reminder = interview.get('pre_interview_reminder');
            reminder.setDataValue('interview', interview);
            markReminderAsSent(reminder, cb);
          });
        }, callback);
      });
    },
    function updatePostInterviewReminders (callback) {
      Interview.findAll(postInterviewQuery).asCallback(function handleFindAll (err, interviews) {
        if (err) { return logError(err, job, callback); }
        async.forEach(interviews, function handleInterview (interview, cb) {
          var candidate = interview.get('candidate');
          handleApplicationInterviews(interview.get('application'));
          emails.postInterviewReminder({
            to: candidate.get('email')
          }, {
            interview: interview.get({plain: true}),
            application: interview.get('application').get({plain: true}),
            email: candidate.get('email')
          }, function handleSend (err) {
            if (err) { return logError(err, job, cb); }
            var reminder = interview.get('post_interview_reminder');
            reminder.setDataValue('interview', interview);
            markReminderAsSent(reminder, cb);
          });
        }, callback);
      });
    },
    function updateReceivedOfferReminders (callback) {
      Application.findAll(receivedOfferQuery).asCallback(function handleFindAll (err, applications) {
        if (err) { return logError(err, job, callback); }
        async.forEach(applications, function handleApplication (application, cb) {
          var candidate = application.get('candidate');
          emails.receivedOfferReminder({
            to: candidate.get('email')
          }, {
            application: application,
            email: candidate.get('email')
          }, function handleSend (err) {
            if (err) { return logError(err, job, cb); }
            var reminder = application.get('received_offer_reminder');
            markReminderAsSent(reminder, cb);
          });
        }, callback);
      });
    }
  ], function handleResult (err) {
    // If there was an error (there shouldn't be as they're logged), then call back with it
    if (err) {
      return done(err);
    }

    // Otherwise, determine if we should re-run ourself
    async.parallel([
      function (cb) { Application.count(savedForLaterQuery).asCallback(cb); },
      function (cb) { Application.count(waitingForResponseQuery).asCallback(cb); },
      function (cb) { Interview.count(preInterviewQuery).asCallback(cb); },
      function (cb) { Interview.count(postInterviewQuery).asCallback(cb); },
      function (cb) { Application.count(receivedOfferQuery).asCallback(cb); }
    ], function handleCounts (err, counts) {
      // If there was an error, call back with it
      if (err) { return done(err); }

      // If we have at least 1 incomplete, then re-run ourselves
      var total = counts.reduce(function (a, b) { return a + b; }, 0);
      if (total > 0) {
        exports._triggerProcessReminders();
      }
      done();
    });
  });
});
