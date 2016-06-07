// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /interview/:id from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Complete form for test
  var interviewId = 'abcdef-sky-networks-interview-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/interview/' + interviewId))
    .save({method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId),
      htmlForm: true, followRedirect: false});

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('redirects to the interview page', function () {
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('location', '/interview/' + interviewId);
  });

  it.skip('updates our interview in the database', function () {
    // Verify data in PostgreSQL
  });

  describe('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Changes saved');
    });
  });
});

describe.skip('A request to POST /interview/:id for a past interview from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Complete form for test
  var interviewId = 'abcdef-sky-networks-interview-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/interview/' + interviewId))
    .save({method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId),
      htmlForm: true, followRedirect: false});

  it('doesn\'t change application status', function () {
    // Verify data in PostgreSQL
  });
});

describe.skip('A request to POST /interview/:id for an upcoming interview from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Complete form for test
  var interviewId = 'abcdef-sky-networks-interview-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/interview/' + interviewId))
    .save({method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId),
      htmlForm: true, followRedirect: false});

  it('changes application status to "Upcoming interview"', function () {
    // Verify data in PostgreSQL
  });
});

describe.skip('A request to POST /interview/:id from a non-owner user', function () {
  // Start our server, log in (need to do), and make our request
  var interviewId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/interview/' + interviewId))
    .save({method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId),
      htmlForm: true, followRedirect: false});

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to POST /interview/:id from a user that ' +
    'owns the interview yet doesn\'t own the application', function () {
  // TODO: Enforce interview must have the same owner as application via DB restrictions
  // Start our server, log in (need to do), and make our request
  var interviewId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/interview/' + interviewId))
    .save({method: 'POST', url: serverUtils.getUrl('/interview/' + interviewId),
      htmlForm: true, followRedirect: false});

  it('recieves an error', function () {
    // DEV: This verifies we don't leak sensitive info if something goes wrong
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(500);
  });
});

describe.skip('A request to POST /interview/:id that doesn\'t exist', function () {
  // Start our server, log in (need to do), and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/interview/does-not-exist'))
    .save({method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist'),
      htmlForm: true, followRedirect: false});

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to POST /interview/:id from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save({method: 'POST', url: serverUtils.getUrl('/interview/does-not-exist'),
      htmlForm: true, followRedirect: false});

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
