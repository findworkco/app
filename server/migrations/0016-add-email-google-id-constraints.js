// Load in our dependencies
var multiline = require('multiline');
var Promise = require('bluebird');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // DEV: Constraint listings are taken via copy/paste from `\d {{table-name}}` in `psql`
    // https://www.postgresql.org/message-id/c57a8ecec259afdc4f4caafc5d0e92eb@mitre.org
    // https://www.postgresql.org/docs/9.3/static/sql-dropindex.html
    queryInterface.sequelize.query(multiline(function () {/*
      -- Add additional constraint/functional index for emails
      -- DEV: This won't be used for normal SELECT's, only when `LOWER(email)` is used
      CREATE UNIQUE INDEX "candidates_email_unique_lower_idx" ON candidates (LOWER(email));

      -- Add normal Google id contstraint
      ALTER TABLE candidates ADD CONSTRAINT "candidates_google_id_key"
        UNIQUE (google_id);
      */}), {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // We only altered constraints, undoing changes is superfluous
  ]); });
};
