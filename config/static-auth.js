// Define our configurations
exports.common = {
  // No common configuration
};

exports.development = {
  authEmailTimeout: 15 * 60 * 60 * 1000 // 15 minutes
};

exports.test = {
  authEmailTimeout: 100 // 100ms
};

exports.production = {
  authEmailTimeout: exports.development.authEmailTimeout
};
