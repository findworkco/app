// Define our configurations
exports.common = {
};

exports.development = {
  // https://analytics.google.com/analytics/web/#report/defaultid/a77675307w116585208p121920111/
  googleAnalyticsId: 'UA-77675307-1',
  serveAnalytics: true
};

exports.test = {
  serveAnalytics: false
};

exports.production = {
  // https://analytics.google.com/analytics/web/#report/defaultid/a77668006w116582710p121920011/
  googleAnalyticsId: 'UA-77668006-1',
  serveAnalytics: true
};
