// Load in our dependencies
var SpyServerFactory = require('spy-server');
var config = require('./server').config;

// Generate our server and set up fixtures
var externalProxyFactory = new SpyServerFactory({port: config.externalProxy.url.port});

externalProxyFactory.addFixture('/#valid', {
  method: 'get',
  route: '/',
  response: function (req, res) {
    res.send('<title>External mock name</title>');
  }
});

externalProxyFactory.addFixture('/#no-title', {
  method: 'get',
  route: '/',
  response: function (req, res) {
    res.send('<body>Mock body</body>');
  }
});

// One-off for timeout testing
externalProxyFactory.addFixture('/#timeout', {
  method: 'get',
  route: '/',
  response: function (req, res) {
    setTimeout(function () {
      res.send('<title>External mock name</title>');
    }, 1000);
  }
});

// Export our factory
module.exports = externalProxyFactory;
