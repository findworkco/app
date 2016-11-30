// Load in our dependencies
var AuditLog = require('../models/audit-log');
var emails = require('../emails');
var getExternalUrl = require('../index.js').getExternalUrl;

// Present welcome email as something we can mock over
// DEV: We will eventually move to a job queue so this fits into it well
exports.sendWelcomeEmail = function (candidate, cb) {
  // If we have sent a welcome email already, then bail out
  // DEV: We use an attribute to prevent repeat emails due to job queues not being idempotent
  if (candidate.get('welcome_email_sent')) {
    return cb(null);
  }

  // Otherwise, send our welcome email
  emails.welcome({
    to: candidate.get('email')
  }, {
    add_application_url: getExternalUrl('/add-application'),
    email: candidate.get('email')
  }, function handleSend (err) {
    // If there was an error, callback with it
    if (err) { return cb(err); }

    // Update our candidate with a `welcome_email_sent` attribute
    candidate.update({
      welcome_email_sent: true
    }, {
      // TODO: Update source to be job queue whenever we find out what that's named
      _sourceType: AuditLog.SOURCE_SERVER
    }).asCallback(cb);
  });
};
