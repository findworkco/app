// Export our helpers
exports.shouldReplaceReminder = function (reminder, attrs) {
  // If the reminder has been sent, replace it if some attribute changed
  if (reminder.get('sent_at_moment')) {
    return Object.keys(attrs).some(function attrChanged (attrKey) {
      return attrs[attrKey] !== reminder.get(attrKey);
    });
  }

  // Otherwise, don't replace it
  return false;
};
