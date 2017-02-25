// Load in our dependencies
var expect = require('chai').expect;
var app = require('./utils/server').app;
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario('A successful job', {
  dbFixtures: null,
  flushRedis: true
}, function () {
  // Spy on Sentry, silence Winston, and make our request
  serverUtils.stubEmails();
  sinonUtils.spy(app.sentryClient, 'captureError');
  sinonUtils.stub(app.winston, 'error');
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/_dev/email/queue/test'),
    expectedStatusCode: 200
  });
  before(function waitForRemoveToComplete (done) {
    setTimeout(done, 100);
  });

  it('has no errors', function () {
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(0);
    var winstonErrorStub = app.winston.error;
    expect(winstonErrorStub.callCount).to.equal(0);
  });

  it('cleans up after itself in Redis', function (done) {
    // DEV: We might need to add FLUSHDB command to the start of this test
    app.redisClient.keys('kue:*', function handleKeys (err, keys) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Otherwise, verify we have/don't have our expected keys
      // DEV: These keys also verify that the job indeed succeeded as expected
      expect(keys).to.contain('kue:jobs:sendTestEmail:complete');
      expect(keys).to.not.contain('kue:jobs:sendTestEmail:failed');
      var jobKeys = keys.filter(function isJobKey (key) {
        return key.match(/kue:job:\d+/);
      });
      expect(jobKeys).to.deep.equal([]);
      done();
    });
  });
});

scenario('An error-interrupted job', {
  dbFixtures: null,
  flushRedis: true
}, function () {
  // Spy on Sentry, silence Winston, and make our request
  sinonUtils.spy(app.sentryClient, 'captureError');
  sinonUtils.stub(app.winston, 'error');
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/error/queue/sync-error'),
    expectedStatusCode: 200
  });
  before(function waitForRemoveToComplete (done) {
    setTimeout(done, 100);
  });

  it('reports errors to Sentry', function () {
    // Assert Sentry info
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(1);
    var captureErrorArgs = captureErrorSpy.args[0];
    expect(captureErrorArgs[0].message).to.equal('Synchronous error');
    expect(captureErrorArgs[1].extra.jobId).to.be.a('Number');
    expect(captureErrorArgs[1].extra.jobType).to.equal('generateSyncError');
    expect(captureErrorArgs[1].extra.jobData).to.be.a('Object');

    // Assert not Winston info
    var winstonErrorStub = app.winston.error;
    expect(winstonErrorStub.callCount).to.equal(1);
    expect(winstonErrorStub.args[0][0].message).to.equal('Synchronous error');
  });

  it('cleans up after itself in Redis', function (done) {
    app.redisClient.keys('kue:*', function handleKeys (err, keys) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Otherwise, verify we have/don't have our expected keys
      // DEV: These keys also verify that the job indeed failed as expected
      expect(keys).to.contain('kue:jobs:generateSyncError:failed');
      expect(keys).to.not.contain('kue:jobs:generateSyncError:complete');
      var jobKeys = keys.filter(function isJobKey (key) {
        return key.match(/kue:job:\d+/);
      });
      expect(jobKeys).to.deep.equal([]);
      done();
    });
  });
});

scenario('A failed job', {
  dbFixtures: null,
  flushRedis: true
}, function () {
  // Spy on Sentry, silence Winston, and make our request
  sinonUtils.spy(app.sentryClient, 'captureError');
  sinonUtils.stub(app.winston, 'error');
  httpUtils.session.init().save({
    url: serverUtils.getUrl('/error/queue/failure'),
    expectedStatusCode: 200
  });
  before(function waitForRemoveToComplete (done) {
    setTimeout(done, 100);
  });

  it('reports errors to Sentry', function () {
    // Assert Sentry info
    var captureErrorSpy = app.sentryClient.captureError;
    expect(captureErrorSpy.callCount).to.equal(1);
    var captureErrorArgs = captureErrorSpy.args[0];
    expect(captureErrorArgs[0].message).to.equal('Failure error');
    expect(captureErrorArgs[1].extra.jobId).to.be.a('Number');
    expect(captureErrorArgs[1].extra.jobType).to.equal('generateFailureError');
    expect(captureErrorArgs[1].extra.jobData).to.be.a('Object');

    // Assert not Winston info
    var winstonErrorStub = app.winston.error;
    expect(winstonErrorStub.callCount).to.equal(1);
    expect(winstonErrorStub.args[0][0].message).to.equal('Failure error');
  });

  it('cleans up after itself in Redis', function (done) {
    app.redisClient.keys('kue:*', function handleKeys (err, keys) {
      // If there was an error, callback with it
      if (err) {
        return done(err);
      }

      // Otherwise, verify we have/don't have our expected keys
      // DEV: These keys also verify that the job indeed failed as expected
      expect(keys).to.contain('kue:jobs:generateFailureError:failed');
      expect(keys).to.not.contain('kue:jobs:generateFailureError:complete');
      var jobKeys = keys.filter(function isJobKey (key) {
        return key.match(/kue:job:\d+/);
      });
      expect(jobKeys).to.deep.equal([]);
      done();
    });
  });
});
