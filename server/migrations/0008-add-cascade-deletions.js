// Load in our dependencies
var multiline = require('multiline');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
// DEV: `createTable` doesn't support adding indicies so we do that separately
//   https://github.com/sequelize/sequelize/blob/v3.28.0/lib/dialects/postgres/query-generator.js#L38-L94
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // DEV: We can't use `changeColumn` as it doesn't use same name for constraints as during `createTable` -_-;;
    // DEV: Constraint listings are taken via copy/paste from `\d {{table-name}}` in `psql`
    queryInterface.sequelize.query(multiline(function () {/*
      -- Applications
      ALTER TABLE applications DROP CONSTRAINT "applications_candidate_id_fkey";
      ALTER TABLE applications ADD CONSTRAINT "applications_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE applications DROP CONSTRAINT "applications_received_offer_reminder_id_fkey";
      ALTER TABLE applications ADD CONSTRAINT "applications_received_offer_reminder_id_fkey"
        FOREIGN KEY (received_offer_reminder_id) REFERENCES application_reminders(id)
        ON UPDATE CASCADE ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE applications DROP CONSTRAINT "applications_saved_for_later_reminder_id_fkey";
      ALTER TABLE applications ADD CONSTRAINT "applications_saved_for_later_reminder_id_fkey"
        FOREIGN KEY (saved_for_later_reminder_id) REFERENCES application_reminders(id)
        ON UPDATE CASCADE ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE applications DROP CONSTRAINT "applications_waiting_for_response_reminder_id_fkey";
      ALTER TABLE applications ADD CONSTRAINT "applications_waiting_for_response_reminder_id_fkey"
        FOREIGN KEY (waiting_for_response_reminder_id) REFERENCES application_reminders(id)
        ON UPDATE CASCADE ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;

      -- Interviews
      ALTER TABLE interviews DROP CONSTRAINT "interviews_application_id_fkey";
      ALTER TABLE interviews ADD CONSTRAINT "interviews_application_id_fkey"
        FOREIGN KEY (application_id) REFERENCES applications(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE interviews DROP CONSTRAINT "interviews_candidate_id_fkey";
      ALTER TABLE interviews ADD CONSTRAINT "interviews_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE interviews DROP CONSTRAINT "interviews_post_interview_reminder_id_fkey";
      ALTER TABLE interviews ADD CONSTRAINT "interviews_post_interview_reminder_id_fkey"
        FOREIGN KEY (post_interview_reminder_id) REFERENCES interview_reminders(id)
        ON UPDATE CASCADE ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE interviews DROP CONSTRAINT "interviews_pre_interview_reminder_id_fkey";
      ALTER TABLE interviews ADD CONSTRAINT "interviews_pre_interview_reminder_id_fkey"
        FOREIGN KEY (pre_interview_reminder_id) REFERENCES interview_reminders(id)
        ON UPDATE CASCADE ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;

      -- Reminders
      ALTER TABLE reminders DROP CONSTRAINT "reminders_candidate_id_fkey";
      ALTER TABLE reminders ADD CONSTRAINT "reminders_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

      -- Application reminders
      ALTER TABLE application_reminders DROP CONSTRAINT "application_reminders_application_id_fkey";
      ALTER TABLE application_reminders ADD CONSTRAINT "application_reminders_application_id_fkey"
        FOREIGN KEY (application_id) REFERENCES applications(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE application_reminders DROP CONSTRAINT "application_reminders_candidate_id_fkey";
      ALTER TABLE application_reminders ADD CONSTRAINT "application_reminders_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

      -- Interview reminders
      ALTER TABLE interview_reminders DROP CONSTRAINT "interview_reminders_interview_id_fkey";
      ALTER TABLE interview_reminders ADD CONSTRAINT "interview_reminders_interview_id_fkey"
        FOREIGN KEY (interview_id) REFERENCES interviews(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
      ALTER TABLE interview_reminders DROP CONSTRAINT "interview_reminders_candidate_id_fkey";
      ALTER TABLE interview_reminders ADD CONSTRAINT "interview_reminders_candidate_id_fkey"
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
    */}), {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // We only altered constraints, undoing changes is superfluous
  ]); });
};
