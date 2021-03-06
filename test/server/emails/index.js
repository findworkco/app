// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var expect = require('chai').expect;
var cheerio = require('cheerio');
var Application = require('../../../server/models/application');
var dbFixtures = require('../utils/db-fixtures');
var emails = require('../../../server/emails');
var includes = require('../../../server/models/utils/includes');
var InterviewReminder = require('../../../server/models/interview-reminder');
var sinonUtils = require('../../utils/sinon');

// Define one-off helper utilities
var emailUtils = {
  saveEmail: function (fn) {
    before(function saveResultFn (done) {
      var that = this;
      fn.call(this, function handleResult (err, result) {
        // If there was an error, callback with it
        if (err) { return done(err); }

        // Otherwise, save our result and callback
        that.subject = result.subject;
        that.html = result.html;
        that.$ = cheerio.load(result.html);
        done();
      });
    });
    after(function cleanup () {
      delete this.subject;
      delete this.html;
      delete this.$;
    });
  }
};

// Start our tests
// EMAIL: Saved for later reminder
function renderSavedForLaterEmail() {
  emailUtils.saveEmail(function generateEmail (callback) {
    emails.savedForLaterReminder._testRender({
      email: 'mock-user',
      application: this.models[dbFixtures.APPLICATION_SAVED_FOR_LATER_KEY].get({plain: true})
    }, callback);
  });
}
scenario('A saved for later reminder email with application notes', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderSavedForLaterEmail();

  it('includes application details', function () {
    expect(this.subject).to.equal('Application reminder for "Intertrode"');
    expect(this.html).to.contain('Hi mock-user,');
    expect(this.html).to.contain('reminder to apply to "Intertrode"');
    expect(this.$('a[href^="https://www.dice.com"]')).to.have.length(1);
    expect(this.$('a[href="https://findwork.test/application/abcdef-intertrode-uuid"]')).to.have.length(2);
  });

  // Notes specific content
  it('includes application notes', function () {
    expect(this.html).to.contain('Website: http://intertrode.net/');
  });
});

scenario('A saved for later reminder email without application notes nor posting URL', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER_EMPTY, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderSavedForLaterEmail();

  it('includes no application notes nor posting URL', function () {
    expect(this.html).to.contain('<i>No URL provided</i>');
    expect(this.html).to.contain('<i>No notes recorded</i>');
  });
});

// EMAIL: Waiting for response reminder
function renderWaitingForResponseEmail() {
  emailUtils.saveEmail(function generateEmail (callback) {
    emails.waitingForResponseReminder._testRender({
      email: 'mock-user',
      application: this.models[dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_KEY].get({plain: true})
    }, callback);
  });
}
scenario('A waiting for response reminder email with application notes', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderWaitingForResponseEmail();

  it('includes application details', function () {
    expect(this.subject).to.equal('Follow-up reminder for "Sky Networks"');
    expect(this.html).to.contain('Hi mock-user,');
    expect(this.html).to.contain('reminder to follow-up to "Sky Networks"');
    expect(this.$('a[href^="https://github.com"]')).to.have.length(1);
    expect(this.$('a[href="https://findwork.test/application/abcdef-sky-networks-uuid"]')).to.have.length(2);
  });

  // Notes specific content
  it('includes application notes', function () {
    expect(this.html).to.contain('100 employees, focused on AI');
  });
});

scenario('A waiting for response reminder email without application notes nor posting URL', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_EMPTY, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderWaitingForResponseEmail();

  it('includes no notes text nor posting URL', function () {
    expect(this.html).to.contain('<i>No URL provided</i>');
    expect(this.html).to.contain('<i>No notes recorded</i>');
  });
});

scenario('A waiting for response reminder email with HTML-based notes', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_HTML_NOTES, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderWaitingForResponseEmail();

  it('includes renders scrubbed HTML notes', function () {
    expect(this.html).to.not.contain('script');
    expect(this.html).to.contain('<b>Mock HTML notes</b>');
  });
});
// EMAIL: Pre-interview reminder
function renderPreInterviewEmail() {
  before(function reloadInterview (done) {
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    interview.reload({
      include: [
        {model: Application},
        {model: InterviewReminder, as: 'post_interview_reminder'}
      ]
    }).asCallback(done);
  });
  emailUtils.saveEmail(function generateEmail (callback) {
    var interview = this.models[dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY];
    emails.preInterviewReminder._testRender({
      email: 'mock-user',
      application: interview.get('application').get({plain: true}),
      interview: interview.get({plain: true})
    }, callback);
  });
}
scenario('A pre-interview reminder email with notes, details, and a post-interview reminder', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW_FULL, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  sinonUtils.stub(_, 'sample', function returnFixedSample (arr, amount) {
    assert.strictEqual(amount, undefined, 'Received unexpected "amount" parameter');
    return arr[0];
  });
  renderPreInterviewEmail();

  it('includes application details', function () {
    expect(this.subject).to.equal('Pre-interview reminder for "Umbrella Corporation"');
    expect(this.html).to.contain('Hi mock-user,');
    expect(this.html).to.contain('reminder about the upcoming interview for "Umbrella Corporation"');
    expect(this.$('blockquote').text()).to.contain('Choose a job you love');
    expect(this.$('blockquote').text()).to.contain('- Confucius');
    expect(this.$('a[href^="https://www.linkedin.com"]')).to.have.length(1);
    expect(this.$('a[href="https://findwork.test/application/abcdef-umbrella-corp-uuid"]')).to.have.length(2);
    expect(this.$('a[href="https://findwork.test/interview/abcdef-umbrella-corp-interview-uuid"]')).to.have.length(2);
  });

  // Notes/details/reminder specific content
  it('includes application notes', function () {
    expect(this.html).to.contain('1000 employees');
  });

  it('includes interview details', function () {
    expect(this.html).to.contain('Go to 1200 Lake St, Suite 303, Chicago');
  });

  it('includes post-interview reminder info', function () {
    expect(this.html).to.contain('Thu Jan 20 at 5:00PM CST');
  });
});

scenario('A pre-interview reminder email with no notes, no details, and no post-interview reminder', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW_EMPTY, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderPreInterviewEmail();

  it('includes no posting URL', function () {
    expect(this.html).to.contain('<i>No URL provided</i>');
  });

  it('includes no notes text', function () {
    expect(this.html).to.contain('<i>No notes recorded</i>');
  });

  it('includes no details text', function () {
    expect(this.html).to.contain('<i>No details provided</i>');
  });

  it('includes no reminder text', function () {
    expect(this.html).to.contain('<i>No reminder scheduled</i>');
  });
});

scenario('A pre-interview reminder email with HTML-based notes', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW_HTML_NOTES, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderPreInterviewEmail();

  it('includes renders scrubbed HTML notes', function () {
    expect(this.html).to.not.contain('script');
    expect(this.html).to.contain('<b>Mock HTML notes</b>');
  });
});

// EMAIL: Post-interview reminder
function renderPostInterviewEmail(interviewKey) {
  before(function reloadInterview (done) {
    var interview = this.models[interviewKey];
    interview.reload({
      include: [{
        model: Application,
        include: includes.updateInterviewApplication
      }]
    }).asCallback(done);
  });
  emailUtils.saveEmail(function generateEmail (callback) {
    var interview = this.models[interviewKey];
    emails.postInterviewReminder._testRender({
      email: 'mock-user',
      application: interview.get('application').get({plain: true}),
      interview: interview.get({plain: true})
    }, callback);
  });
}
scenario('A post-interview reminder email for a follow-up interview', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderPostInterviewEmail(dbFixtures.INTERVIEW_WAITING_FOR_RESPONSE_KEY);

  it('includes application details', function () {
    expect(this.subject).to.equal('Post-interview reminder for "Sky Networks"');
    expect(this.html).to.contain('Hi mock-user,');
    expect(this.html).to.contain('post-interview reminder for "Sky Networks"');
    expect(this.$('a[href^="https://github.com"]')).to.have.length(1);
    expect(this.$('a[href="https://findwork.test/application/abcdef-sky-networks-uuid"]')).to.have.length(3);
    expect(this.$('a[href="https://findwork.test/interview/abcdef-sky-networks-interview-uuid"]')).to.have.length(1);
  });

  // Application status specific
  it('includes waiting for response reminder info', function () {
    expect(this.html).to.contain('Tue Jan 25 at 12:00PM CST');
  });
});

scenario('A post-interview reminder email for an application with no posting URL', {
  dbFixtures: [dbFixtures.APPLICATION_WAITING_FOR_RESPONSE_EMPTY, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderPostInterviewEmail(dbFixtures.INTERVIEW_WAITING_FOR_RESPONSE_KEY);

  it('includes no posting URL', function () {
    expect(this.html).to.contain('<i>No URL provided</i>');
  });
});

scenario('A post-interview reminder email for an application with an upcoming interview', {
  dbFixtures: [dbFixtures.APPLICATION_UPCOMING_INTERVIEW, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderPostInterviewEmail(dbFixtures.INTERVIEW_UPCOMING_INTERVIEW_KEY);

  it('includes upcoming interview info', function () {
    expect(this.html).to.contain('Thu Jan 20 at 2:00PM CST');
  });
});

scenario('A post-interview reminder email for a received offer application', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderPostInterviewEmail(dbFixtures.INTERVIEW_RECEIVED_OFFER_KEY);

  it('includes received offer reminder info', function () {
    expect(this.html).to.contain('Sat Jan 1 at 12:00PM CST');
  });
});

// EMAIL: Received offer reminder
function renderReceivedOfferEmail() {
  emailUtils.saveEmail(function generateEmail (callback) {
    emails.receivedOfferReminder._testRender({
      email: 'mock-user',
      application: this.models[dbFixtures.APPLICATION_RECEIVED_OFFER_KEY].get({plain: true})
    }, callback);
  });
}
scenario('A received offer reminder email with application notes', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderReceivedOfferEmail();

  it('includes application details', function () {
    expect(this.subject).to.equal('Response reminder for "Black Mesa"');
    expect(this.html).to.contain('Hi mock-user,');
    expect(this.html).to.contain('reminder to respond to "Black Mesa"');
    expect(this.$('a[href^="https://www.nature.com"]')).to.have.length(1);
    expect(this.$('a[href="https://findwork.test/application/abcdef-black-mesa-uuid"]')).to.have.length(2);
  });

  // Notes specific content
  it('includes application notes', function () {
    expect(this.html).to.contain('300 employees');
  });
});

scenario('A received offer reminder email without application notes nor posting URL', {
  dbFixtures: [dbFixtures.APPLICATION_RECEIVED_OFFER_EMPTY, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  renderReceivedOfferEmail();

  it('includes no application notes nor posting URL', function () {
    expect(this.html).to.contain('<i>No URL provided</i>');
    expect(this.html).to.contain('<i>No notes recorded</i>');
  });
});
