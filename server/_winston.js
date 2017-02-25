// Load in our dependencies
var winston = require('winston');
var WinstonDailyRotateFile = require('winston-daily-rotate-file');

// Load our config
var config = require('../config').getConfig();

// Create Winston transports
// DEV: We use a standalone file for Sentry so our `master` process can load it without excess
var winstonTransports = config.winstonTransports.map(function createTransport (transportInfo) {
  switch (transportInfo.type) {
    case 'console':
      return new winston.transports.Console(transportInfo.options);
    case 'daily-rotate-file':
      return new WinstonDailyRotateFile(transportInfo.options);
    default:
      throw new Error('Unrecognized logger type "' + transportInfo.type + '"');
  }
});

// Create and expose Winston
module.exports = new winston.Logger({
  transports: winstonTransports
});
