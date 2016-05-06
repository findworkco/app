// Define our configurations
exports.common = {
};

exports.development = {
  // DEV: We use 0.0.0.0 for allow access from Vagrant's host machine
  hostname: '0.0.0.0',
  port: 9000
};
exports.development.url = {
  internal: {
    protocol: 'http',
    hostname: 'localhost',
    port: exports.development.port
  },
  external: {
    protocol: 'http',
    hostname: 'localhost',
    port: exports.development.port
  }
};

exports.test = {
  // Only allow inbound connections on loopback
  hostname: 'localhost',
  port: 9001
};
exports.test.url = {
  internal: {
    protocol: 'http',
    hostname: exports.test.hostname,
    port: exports.test.port
  },
  external: {
    protocol: 'https',
    hostname: 'findwork.test'
  }
};

exports.production = {
  // Only allow inbound connections on loopback
  hostname: 'localhost',
  port: 9000
};
exports.production.url = {
  internal: {
    protocol: 'http',
    hostname: exports.production.hostname,
    port: exports.production.port
  },
  external: {
    protocol: 'https',
    hostname: 'findwork.co'
  }
};
