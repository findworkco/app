// Define our configurations
exports.common = {
};

// TODO: When we move to Vagrant, update `hostname` to be `0.0.0.0` so we can access it
exports.development = {
  hostname: 'localhost',
  port: 9000
};
exports.development.url = {
  internal: {
    protocol: 'http',
    hostname: exports.development.hostname,
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
