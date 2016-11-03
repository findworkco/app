// Load in our dependencies
var expect = require('chai').expect;
var Interview = require('../../../server/models/interview.js');

// Start our tests
describe('An Interview model', function () {
  it.skip('requires `date_time` to be non-empty', function () {
    var interview = Interview.build({});
    expect(interview).to.equal(false);
  });

  it.skip('requires `pre_interview_reminder` to be null or before `date_time`', function () {
    var interview = Interview.build({});
    expect(interview).to.equal(false);
  });
  it.skip('requires `post_interview_reminder` to be null or after `date_time`', function () {
    var interview = Interview.build({});
    expect(interview).to.equal(false);
  });
});
