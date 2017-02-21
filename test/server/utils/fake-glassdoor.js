// Load in our dependencies
var fs = require('fs');
var SpyServerFactory = require('spy-server');
var config = require('./server').config;

// Generate our server and set up fixtures
var fakeGlassdoorFactory = new SpyServerFactory({port: config.fakeGlassdoor.port});

// curl 'https://api.glassdoor.com/api/api.htm?v=1&format=json&action=employers&q=ibm&userip=127.0.0.1&useragent=Node.js/4.6.2&t.p=55428&t.k=****&ps=1'
//   Tweaked to contain less results
// DEV: We could use `eight-track`/`nine-track` but this was quicker to set up
//   Additionally, we would likely still do "success: false" by hand
var fullResponse = fs.readFileSync(__dirname + '/http-fixtures/glassdoor-200-full.json', 'utf8');
fakeGlassdoorFactory.addFixture('/api/api.htm#full', {
  method: 'get',
  route: '/api/api.htm',
  response: function (req, res) {
    res.status(200).type('application/json').send(fullResponse);
  }
});

// curl 'https://api.glassdoor.com/api/api.htm?v=1&format=json&action=employers&q=not-found&userip=127.0.0.1&useragent=Node.js/4.6.2&t.p=55428&t.k=****&ps=1'
var emptyResponse = fs.readFileSync(__dirname + '/http-fixtures/glassdoor-200-empty.json', 'utf8');
fakeGlassdoorFactory.addFixture('/api/api.htm#empty', {
  method: 'get',
  route: '/api/api.htm',
  response: function (req, res) {
    res.status(200).type('application/json').send(emptyResponse);
  }
});

// curl 'https://api.glassdoor.com/api/api.htm?v=1&format=json&action=employers&q=angellist&userip=127.0.0.1&useragent=Node.js/4.6.2&t.p=55428&t.k=****&ps=1'
var blankResponse = fs.readFileSync(__dirname + '/http-fixtures/glassdoor-200-blank.json', 'utf8');
fakeGlassdoorFactory.addFixture('/api/api.htm#blank', {
  method: 'get',
  route: '/api/api.htm',
  response: function (req, res) {
    res.status(200).type('application/json').send(blankResponse);
  }
});

// curl 'https://api.glassdoor.com/api/api.htm?v=1&format=json&action=employers&q=not-found&userip=127.0.0.1&useragent=Node.js/4.6.2&t.p=55428&ps=1'
var errorResponse = fs.readFileSync(__dirname + '/http-fixtures/glassdoor-403.json', 'utf8');
fakeGlassdoorFactory.addFixture('/api/api.htm#error', {
  method: 'get',
  route: '/api/api.htm',
  response: function (req, res) {
    res.status(403).type('application/json').send(errorResponse);
  }
});

// One-off for timeout testing
fakeGlassdoorFactory.addFixture('/api/api.htm#timeout', {
  method: 'get',
  route: '/api/api.htm',
  response: function (req, res) {
    setTimeout(function () {
      res.status(200).type('application/json').send(fullResponse);
    }, 1000);
  }
});

// Export our factory
module.exports = fakeGlassdoorFactory;
