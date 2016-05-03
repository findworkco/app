// Load in our dependencies
var app = require('../index.js').app;

// Bind our controllers
app.get('/', function getRoot (req, res, next) {
  res.send('Hello World!');
});
