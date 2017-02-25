// Load in our dependencies
var fs = require('fs');
// DEV: ORM evaluation -- https://gist.github.com/twolfson/13eeeb547271c8ee32707f7b02c2ed90
var Sequelize = require('sequelize');
var winston = require('../_winston');

// Load our config
var config = require('../../config').getConfig();

// Create and export our PostgreSQL client
// http://docs.sequelizejs.com/en/latest/docs/getting-started/#setting-up-a-connection
// http://docs.sequelizejs.com/en/v3/api/sequelize/#new-sequelizedatabase-usernamenull-passwordnull-options
var psqlConfig = config.postgresql;
var queryLogFileStream;
if (config.logQueries) {
  winston.info('Recording queries to "queries.log"');
  queryLogFileStream = fs.createWriteStream('queries.log');
}
module.exports = new Sequelize(psqlConfig.database, psqlConfig.username, psqlConfig.password, {
  host: psqlConfig.host,
  port: psqlConfig.port,
  dialect: 'postgres',
  logging: config.logQueries ? function handleQuery (query) {
    // jscs:disable maximumLineLength
    // Executing (default): SELECT "application"."id", ... FROM "applications" AS "application" LEFT OUTER JOIN "candidates" ... LIMIT 100;
    // ->
    // (default) SELECT "application"."id" ... FROM "applications"
    var querySummary = query
      .replace(/^Executing /, '') // Executing (default): -> (default):
      .replace('): ', ') ') // (default): SELECT -> (default) SELECT
      // SELECT "application"."id", ..., "candidate"."id" AS "candidate.id", ... FROM -> SELECT "application.id"... FROM
      // SELECT count("application"."id") AS "count" FROM "applications" -> SELECT count("application"."id") FROM "applications"
      .replace(/(\) [A-Z]+ [^,)]+.)([^A-Z]|AS)+/, '$1... ');
    // jscs:enable maximumLineLength
    winston.info(querySummary.slice(0, 55) + '... (' + query.length + ')');
    queryLogFileStream.write(query + '\n');
  } : false,
  define: {
    // http://docs.sequelizejs.com/en/v3/docs/models-definition/#configuration
    timestamps: true,
    underscored: true
  }
});
