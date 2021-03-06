// Load in our dependencies
var expect = require('chai').expect;
var dbFixtures = require('../utils/db-fixtures');
var Candidate = require('../../../server/models/candidate');
var serverUtils = require('../utils/server');
var queue = require('../../../server/queue');

// Start our tests
scenario.job('A welcome email being sent for the first time', {
  dbFixtures: [dbFixtures.CANDIDATE_NEW]
}, function () {
  serverUtils.stubEmails();
  before(function runSendWelcomeEmail (done) {
    // Retrieve our candidate
    Candidate.findAll().asCallback(function handleFindAll (err, candidates) {
      // Verify the flag isn't set yet
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      expect(candidates[0].get('welcome_email_sent')).equal(false);

      // Perform our job and callback
      var job = queue.create(queue.JOBS.SEND_WELCOME_EMAIL, {
        candidateId: candidates[0].get('id')
      }).save(function (err) { if (err) { throw err; } });
      job.on('complete', function (jobData) { done(); });
    });
  });

  it('sends the welcome email', function () {
    // Verify email sent
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(1);

    // Verify email metadata
    var data = emailSendStub.args[0][0].data;
    expect(data.from).to.deep.equal({name: 'Todd Wolfson', address: 'todd@findwork.co'});
    expect(data.to).to.equal('mock-email@mock-domain.test');

    // Verify email content
    expect(data.html).to.contain('Hi mock-email@mock-domain.test');
    expect(data.html).to.contain('Thanks for signing up for Find Work!');
    expect(data.html).to.contain('https://findwork.test/add-application');
    expect(data.text).to.contain('Hi mock-email@mock-domain.test');
    expect(data.text).to.contain('Thanks for signing up for Find Work!');
    expect(data.text).to.contain('https://findwork.test/add-application');
  });

  it('marks the candidate with a `welcome_email_sent` flag', function (done) {
    // Retrieve our candidate
    Candidate.findAll().asCallback(function handleFindAll (err, candidates) {
      // Verify the flag is set now
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      expect(candidates[0].get('welcome_email_sent')).equal(true);
      done();
    });
  });
});

scenario.job('A welcome email being sent for the second time', {
  dbFixtures: [dbFixtures.CANDIDATE_DEFAULT]
}, function () {
  serverUtils.stubEmails();
  before(function runSendWelcomeEmail (done) {
    // Retrieve our candidate
    Candidate.findAll().asCallback(function handleFindAll (err, candidates) {
      // Verify the flag is set
      if (err) { return done(err); }
      expect(candidates).to.have.length(1);
      expect(candidates[0].get('welcome_email_sent')).equal(true);

      // Perform our job and callback
      var job = queue.create(queue.JOBS.SEND_WELCOME_EMAIL, {
        candidateId: candidates[0].get('id')
      }).save(function (err) { if (err) { throw err; } });
      job.on('complete', function (jobData) { done(); });
    });
  });

  it('is not sent', function () {
    var emailSendStub = this.emailSendStub;
    expect(emailSendStub.callCount).to.equal(0);
  });
});
