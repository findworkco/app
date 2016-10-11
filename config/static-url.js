// Define our configurations
exports.common = {
};

exports.development = {
  listen: {
    // DEV: We use 0.0.0.0 for allow access from Vagrant's host machine
    hostname: '0.0.0.0',
    port: 9000
  }
};
exports.development.url = {
  internal: {
    protocol: 'http',
    hostname: 'localhost',
    port: exports.development.listen.port
  },
  external: {
    protocol: 'http',
    hostname: 'localhost',
    port: exports.development.listen.port
  }
};
// Define proxy trust (e.g. NGINX, nothing)
//   http://expressjs.com/en/4x/api.html#trust.proxy.options.table
exports.development.trustProxy =
  exports.development.url.external.protocol === 'https';

exports.test = {
  // Only allow inbound connections on loopback
  listen: {
    hostname: 'localhost',
    port: 9001
  },
  trustProxy: false
};
exports.test.url = {
  internal: {
    protocol: 'http',
    hostname: exports.test.listen.hostname,
    port: exports.test.listen.port
  },
  external: {
    protocol: 'https',
    hostname: 'findwork.test'
  }
};
exports.test.trustProxy =
  exports.test.url.external.protocol === 'https';

exports.production = {
  // Only allow inbound connections on loopback
  listen: {
    hostname: 'localhost',
    port: 9000
  }
};
exports.production.url = {
  internal: {
    protocol: 'http',
    hostname: exports.production.listen.hostname,
    port: exports.production.listen.port
  },
  external: {
    protocol: 'https',
    hostname: 'findwork.co'
  }
};
exports.production.trustProxy =
  exports.production.url.external.protocol === 'https';
