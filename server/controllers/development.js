// Load in our dependencies
var app = require('../index.js').app;
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Bind our controllers
app.get('/_dev/notification', function devNotificationShow (req, res, next) {
  // Create a notification from our parameters
  var notificationType = req.query.get('type', NOTIFICATION_TYPES.LOG);
  var message = req.query.get('message', '');
  req.flash(notificationType, message);

  // Redirect to a common page
  res.redirect('/schedule');
});
