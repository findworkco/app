// Define our configurations
exports.common = {
};

exports.development = {
  externalProxy: {
    url: null,
    timeout: 5e3 // 5 seconds
  }
};

exports.test = {
  externalProxy: {
    url: {
      protocol: 'http',
      hostname: 'localhost',
      port: 7002
    },
    timeout: 50 // 50ms
  }
};

exports.production = {
  externalProxy: exports.development.externalProxy
};
