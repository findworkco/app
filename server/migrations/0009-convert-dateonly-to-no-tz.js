// Load in our dependencies
var multiline = require('multiline');
var Promise = require('bluebird');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // DEV: We could probably use `changeColumn` but I don't want to worry about sequelize being picky
    // DEV: We typically won't change columns on the fly as it can break production environment
    //   However, these tables are still in development
    // https://www.postgresql.org/docs/9.3/static/sql-altertable.html
    // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/data-types.js#L494-L503
    // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/dialects/postgres/data-types.js#L26-L29
    // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/data-types.js#L441-L459
    // https://github.com/sequelize/sequelize/blob/v3.25.0/lib/dialects/postgres/data-types.js#L101-L105
    queryInterface.sequelize.query(multiline(function () {/*
      -- Rename columns
      ALTER TABLE applications RENAME COLUMN
        "application_date_date" TO "application_date_datetime";
      ALTER TABLE applications RENAME COLUMN
        "archived_at_date" TO "archived_at_datetime";
      ALTER TABLE reminders RENAME COLUMN
        "sent_at_date" TO "sent_at_datetime";

      -- Update column types
      ALTER TABLE applications ALTER COLUMN "application_date_datetime"
        TYPE TIMESTAMP WITH TIME ZONE;
      ALTER TABLE applications ALTER COLUMN "archived_at_datetime"
        TYPE TIMESTAMP WITH TIME ZONE;
      ALTER TABLE reminders ALTER COLUMN "sent_at_datetime"
        TYPE TIMESTAMP WITH TIME ZONE;
    */}), {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.sequelize.query(multiline(function () {/*
      -- Update column types
      ALTER TABLE applications ALTER COLUMN "application_date_datetime"
        TYPE DATE;
      ALTER TABLE applications ALTER COLUMN "archived_at_datetime"
        TYPE DATE;
      ALTER TABLE reminders ALTER COLUMN "sent_at_datetime"
        TYPE DATE;

      -- Rename columns
      ALTER TABLE applications RENAME COLUMN
        "application_date_datetime" TO "application_date_date";
      ALTER TABLE applications RENAME COLUMN
        "archived_at_datetime" TO "archived_at_date";
      ALTER TABLE reminders RENAME COLUMN
        "sent_at_datetime" TO "sent_at_date";
    */}), {transaction: t})

  ]); });
};
