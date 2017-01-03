// Load in our dependencies
// DEV: We load Sequelize for transaction requirement
var multiline = require('multiline');
var Sequelize = require('./utils/sequelize');
var baseDefine = Sequelize;

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // DEV: We don't need to worry about data mapping as these aren't yet used production
    queryInterface.removeColumn('reminders', 'parent_id', {transaction: t}),
    queryInterface.removeColumn('reminders', 'parent_type', {transaction: t}),
    // https://www.postgresql.org/docs/9.3/static/ddl-inherit.html
    // jscs:disable maximumLineLength
    // DEV: CREATE calls based on `sequelize/lib/query-interface#createTable's `sql` variable
    //   CREATE TABLE IF NOT EXISTS "interviews" ("id" VARCHAR(36) , "candidate_id" VARCHAR(36) NOT NULL REFERENCES "candidates" ("id"), ..., PRIMARY KEY ("id"));
    // jscs:enable maximumLineLength
    // DEV: ALTER TABLE calls based on `\d reminders`
    queryInterface.sequelize.query(multiline(function () {/*
      -- Create child table
      CREATE TABLE application_reminders (
        application_id VARCHAR(36) NOT NULL REFERENCES "applications" ("id"),
        PRIMARY KEY ("id")
      ) INHERITS (reminders);
      -- Copy parent foreign key constraints
      ALTER TABLE application_reminders ADD CONSTRAINT "application_reminders_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id);
      -- Move parent-pointing foreign keys from parent to child
      ALTER TABLE "applications" DROP CONSTRAINT "applications_received_offer_reminder_id_fkey";
      ALTER TABLE "applications" ADD CONSTRAINT "applications_received_offer_reminder_id_fkey"
        FOREIGN KEY (received_offer_reminder_id) REFERENCES application_reminders(id);
      ALTER TABLE "applications" DROP CONSTRAINT "applications_saved_for_later_reminder_id_fkey";
      ALTER TABLE "applications" ADD CONSTRAINT "applications_saved_for_later_reminder_id_fkey"
        FOREIGN KEY (saved_for_later_reminder_id) REFERENCES application_reminders(id);
      ALTER TABLE "applications" DROP CONSTRAINT "applications_waiting_for_response_reminder_id_fkey";
      ALTER TABLE "applications" ADD CONSTRAINT "applications_waiting_for_response_reminder_id_fkey"
        FOREIGN KEY (waiting_for_response_reminder_id) REFERENCES application_reminders(id);

      -- Create second child table similarly
      CREATE TABLE interview_reminders (
        interview_id VARCHAR(36) NOT NULL REFERENCES "interviews" ("id"),
        PRIMARY KEY ("id")
      ) INHERITS (reminders);
      ALTER TABLE interview_reminders ADD CONSTRAINT "interview_reminders_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id);
      ALTER TABLE "interviews" DROP CONSTRAINT "interviews_post_interview_reminder_id_fkey";
      ALTER TABLE "interviews" ADD CONSTRAINT "interviews_post_interview_reminder_id_fkey"
        FOREIGN KEY (post_interview_reminder_id) REFERENCES interview_reminders(id);
      ALTER TABLE "interviews" DROP CONSTRAINT "interviews_pre_interview_reminder_id_fkey";
      ALTER TABLE "interviews" ADD CONSTRAINT "interviews_pre_interview_reminder_id_fkey"
        FOREIGN KEY (pre_interview_reminder_id) REFERENCES interview_reminders(id);
    */}), {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    queryInterface.addColumn('reminders', 'parent_id',
      {type: baseDefine.ID, allowNull: false}, {transaction: t}),
    queryInterface.addColumn('reminders', 'parent_type',
      {type: Sequelize.STRING(36), allowNull: false}, {transaction: t}),
    queryInterface.sequelize.query(multiline(function () {/*
      DROP TABLE application_reminders;
      DROP TABLE interview_reminders;
    */}), {transaction: t})
  ]); });
};
