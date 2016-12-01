// Load in our dependencies
var assert = require('assert');
var domain = require('domain');
var AuditLog = require('../models/audit-log');
var Candidate = require('../models/candidate');
var emails = require('../emails');
var app = require('../index.js').app;
var kueQueue = require('../index.js').app.kueQueue;
var getExternalUrl = require('../index.js').getExternalUrl;

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
      jobDomain.on('error', function handleError (err) {
        // Report/log our error
        // DEV: We could throw errors in testing but they won't be caught due to being async
        app.notWinston.error(err);
        app.sentryClient.captureError(err, getSentryKwargsForJob(job));

        // Callback with our error
        done(err);
      });
      jobDomain.run(function callFn () {
        fn.call(that, job, done);
      });
    });
  }
}

// Define an helper for `queue.create` that auto-cleans itself
exports.create = function () {
  // Generate our job
  var job = kueQueue.create.apply(kueQueue, arguments);

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
        app.sentryClient.captureError(err, getSentryKwargsForJob(job));
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
      candidate.update({
        welcome_email_sent: true
      }, {
        _sourceType: AuditLog.SOURCE_QUEUE
      }).asCallback(done);
    });
  });
});
