#!/usr/bin/env bash
# Exit on first error
set -e

# Tear down our existing database
db_name="find_work_test"
if psql "$db_name" --command "SELECT 'hai';" &> /dev/null; then
  dropdb "$db_name"
fi

# Create our new database
createdb "$db_name"

# TODO: Run migrations
