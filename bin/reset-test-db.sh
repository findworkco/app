#!/usr/bin/env bash
# Exit on first error
set -e

# Tear down our existing database
# DEV: We use `postgres` user as `root` doesn't have a PostgreSQL role
# DEV: `postgres` user can't invoke scripts in Wercker so we wrap each line with a `sudo`
#   https://app.wercker.com/findworkco/find-work-app/runs/build/57e2f87797d4d60100524f82
db_name="find_work_test"
if psql "$db_name" --command "SELECT 'hai';" &> /dev/null; then
  sudo su postgres --shell /bin/bash --command "dropdb \"$db_name\""
fi

# Create our new database
sudo su postgres --shell /bin/bash --command "createdb \"$db_name\""

# TODO: Run migrations

echo "Database \"$db_name\" successfully reset" 1>&2
