// Define constants for notifications
exports.TYPES = {
  LOG: 'log',
  ERROR: 'error',
  SUCCESS: 'success',
  GOOGLE_ANALYTICS: 'google_analytics'
};
exports.ACCEPTABLE_TYPES = [
  exports.TYPES.LOG,
  exports.TYPES.ERROR,
  exports.TYPES.SUCCESS
];
