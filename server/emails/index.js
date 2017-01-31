// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var jade = require('jade');
var app = require('../index.js').app;
var emailClient = require('../index.js').app.emailClient;
var getExternalUrl = require('../index.js').getExternalUrl;

// Define email constants
var DEFAULT_FROM_EMAIL = {
  name: 'Todd Wolfson',
  address: 'todd@findwork.co'
};

// Define our email templates
// https://github.com/nodemailer/nodemailer/tree/v2.6.4#custom-renderer
function jadeSender(filepath, options) {
  // Create our render function
  var jadeFn = jade.compileFile(filepath);
  var renderFn = function (context, callback) {
    // Render our email
    var result = jadeFn(_.defaults({
      getExternalUrl: getExternalUrl
    }, context, app.locals));

    // Break up result into subject/HTML
    // <subject>Test email</subject><html>This is a test email</html>
    //   -> "Test email", "This is a test email"
    // DEV: We could use an HTML parser but this is simple enough by convention
    // DEV: We consolidate all pieces into a single file to ease of reference/to prevent sync mistakes
    var parts = result.split('</subject><html>');
    assert.strictEqual(parts.length, 2);
    var subject = parts[0].replace('<subject>', '');
    var html = parts[1].replace('</html>', '');

    // Callback with result
    callback(null, {
      subject: subject,
      // text: Set up via `nodemailer-html-to-text`,
      html: html
    });
  };

  // Bind our render function and re-expose render function for testing
  var retVal = emailClient.templateSender({
    render: renderFn
  }, options);
  retVal._testRender = renderFn;

  // Return our nodemailer integration
  return retVal;
}

exports.test = jadeSender(__dirname + '/test.jade', {
  from: DEFAULT_FROM_EMAIL
});

exports.welcome = jadeSender(__dirname + '/welcome.jade', {
  from: DEFAULT_FROM_EMAIL
});

exports.savedForLaterReminder = jadeSender(__dirname + '/saved-for-later-reminder.jade', {
  from: DEFAULT_FROM_EMAIL
});
exports.waitingForResponseReminder = jadeSender(__dirname + '/waiting-for-response-reminder.jade', {
  from: DEFAULT_FROM_EMAIL
});
exports.preInterviewReminder = jadeSender(__dirname + '/pre-interview-reminder.jade', {
  from: DEFAULT_FROM_EMAIL
});
exports.postInterviewReminder = jadeSender(__dirname + '/post-interview-reminder.jade', {
  from: DEFAULT_FROM_EMAIL
});
exports.receivedOfferReminder = jadeSender(__dirname + '/received-offer-reminder.jade', {
  from: DEFAULT_FROM_EMAIL
});
