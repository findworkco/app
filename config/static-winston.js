// Define our configurations
exports.common = {
};

exports.development = {
  // https://github.com/winstonjs/winston/blob/2.3.1/docs/transports.md#console-transport
  winstonTransports: [{
    type: 'console',
    options: {
      level: 'info',
      colorize: true,
      timestamp: true,
      prettyPrint: true
    }
  }]
};

exports.test = {
  winstonTransports: exports.development.winstonTransports
};

exports.production = {
  // https://github.com/winstonjs/winston-daily-rotate-file/tree/v1.4.4
  // https://github.com/winstonjs/winston/blob/2.3.1/docs/transports.md#file-transport
  // https://github.com/winstonjs/winston/tree/2.3.1#logging-levels
  winstonTransports: [{
    type: 'daily-rotate-file',
    options: {
      level: 'info',
      colorize: false,
      timestamp: true,
      filename: '/var/log/findworkco/app/winston.log',
      json: true,
      prettyPrint: true,
      showLevel: true
    }
  }]
};
