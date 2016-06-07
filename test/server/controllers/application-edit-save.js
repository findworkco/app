// Load in our dependencies
var expect = require('chai').expect;
var httpUtils = require('../utils/http');
var serverUtils = require('../utils/server');

// Start our tests
describe('A request to POST /application/:id to update fields from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Complete form for test
  var applicationId = 'abcdef-sky-networks-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      htmlForm: true, followRedirect: false});

  it('recieves no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('redirects to the application page', function () {
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers.location).to.equal('/application/' + applicationId);
  });

  it.skip('updates our application in the database', function () {
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

describe.skip('A request to POST /application/:id for "Received offer" action from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Submit proper form
  var applicationId = 'abcdef-sky-networks-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      htmlForm: true, followRedirect: false});

  it('redirects to the application page', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    expect(this.res.headers.location).to.equal('/application/' + applicationId);
  });

  it.skip('updates our application in the database', function () {
    // Verify data in PostgreSQL
  });

  describe('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application status updated to: Offer recieved');
    });
  });
});

describe.skip('A request to POST /application/:id to "Archive" action from the owner user', function () {
  // Start our server, log in (need to do), and make our request
  // TODO: Submit proper form
  var applicationId = 'abcdef-sky-networks-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      htmlForm: true, followRedirect: false});

  it('redirects to the schedule page', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    expect(this.res.headers.location).to.equal('/schedule');
  });

  it.skip('updates our application in the database', function () {
    // Verify data in PostgreSQL
  });

  describe('on redirect completion', function () {
    httpUtils.session.save(serverUtils.getUrl('/schedule'));

    it('notifies user of update success', function () {
      expect(this.$('#notification-content > [data-notification=success]').text())
        .to.equal('Application archived');
    });
  });
});

describe.skip('A request to POST /application/:id from a non-owner user', function () {
  // Start our server, log in (need to do), and make our request
  var applicationId = 'abcdef-uuid';
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/' + applicationId))
    .save({method: 'POST', url: serverUtils.getUrl('/application/' + applicationId),
      htmlForm: true, followRedirect: false});

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to POST /application/:id that doesn\'t exist', function () {
  // Start our server, log in (need to do), and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save(serverUtils.getUrl('/application/does-not-exist'))
    .save({method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
      htmlForm: true, followRedirect: false});

  it('recieves a 404', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(404);
  });
});

describe.skip('A request to POST /application/:id from a logged out user', function () {
  // Start our server and make our request
  serverUtils.run();
  httpUtils.session.init()
    .save({method: 'POST', url: serverUtils.getUrl('/application/does-not-exist'),
      htmlForm: true, followRedirect: false});

  // DEV: We require log in for any application to prevent sniffing for which URLs have applications/not
  it('recieves a prompt to log in', function () {
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(302);
    expect(this.res.headers).to.have.property('Location', '/login');
  });
});
