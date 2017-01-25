// Load in our dependencies
var multiline = require('multiline');
var Promise = require('bluebird');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
// DEV: `createTable` doesn't support adding indicies so we do that separately
//   https://github.com/sequelize/sequelize/blob/v3.28.0/lib/dialects/postgres/query-generator.js#L38-L94
exports.up = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // DEV: We can't use `changeColumn` as it doesn't use same name for constraints as during `createTable` -_-;;
    // DEV: Constraint listings are taken via copy/paste from `\d {{table-name}}` in `psql`
    queryInterface.sequelize.query(multiline(function () {/*
      -- Unique constraints
      ALTER TABLE applications ADD CONSTRAINT "applications_candidate_id_unique"
        UNIQUE (id, candidate_id);
      ALTER TABLE interviews ADD CONSTRAINT "interviews_candidate_id_unique"
        UNIQUE (id, candidate_id);
      ALTER TABLE reminders ADD CONSTRAINT "reminders_candidate_id_unique"
        UNIQUE (id, candidate_id);
      ALTER TABLE application_reminders ADD CONSTRAINT "application_reminders_candidate_id_unique"
        UNIQUE (id, candidate_id);
      ALTER TABLE interview_reminders ADD CONSTRAINT "interview_reminders_candidate_id_unique"
        UNIQUE (id, candidate_id);

      -- Interviews
      ALTER TABLE interviews DROP CONSTRAINT "interviews_application_id_fkey";
      ALTER TABLE interviews ADD CONSTRAINT "interviews_application_id_fkey"
        -- DEV: candidate_id comes second so we can keep queries simple with application_id only
        --   http://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys
        FOREIGN KEY (application_id, candidate_id)
        REFERENCES applications(id, candidate_id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

      -- Application reminders
      ALTER TABLE application_reminders DROP CONSTRAINT "application_reminders_application_id_fkey";
      ALTER TABLE application_reminders ADD CONSTRAINT "application_reminders_application_id_fkey"
        -- DEV: candidate_id comes second so we can keep queries simple with application_id only
        --   http://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys
        FOREIGN KEY (application_id, candidate_id)
        REFERENCES applications(id, candidate_id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

      -- Interview reminders
      ALTER TABLE interview_reminders DROP CONSTRAINT "interview_reminders_interview_id_fkey";
      ALTER TABLE interview_reminders ADD CONSTRAINT "interview_reminders_interview_id_fkey"
        -- DEV: candidate_id comes second so we can keep queries simple with application_id only
        --   http://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys
        FOREIGN KEY (interview_id, candidate_id)
        REFERENCES interviews(id, candidate_id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
    */}), {transaction: t})
  ]); });
};
exports.down = function (queryInterface) {
  return queryInterface.sequelize.transaction(function (t) { return Promise.all([
    // We only altered constraints, undoing changes is superfluous
  ]); });
};
