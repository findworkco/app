#!/usr/bin/env bash
# Exit on first error
set -e

# Verify we have the `ENV` environment variable
if test "$ENV" = ""; then
  echo "Expected environment variable \"ENV\" to be defined but it wasn't. Please define it" 1>&2
  exit 1
fi

# If a local db already exists, then exit out
db_name="find_work"
if psql "$db_name" --command "SELECT 'hai';" &> /dev/null; then
  echo "Database \"$db_name\" already exists. Please drop it before creating a new database" 1>&2
  echo "Example: \`dropdb \"$db_name\"\`" 1>&2
  exit 1
fi

# Create our database
sudo su postgres --shell /bin/bash --command "createdb \"$db_name\""

# Run our migrations
npm run migrate-latest

# Notify user of success
echo "Database \"$db_name\" successfully created" 1>&2

# DEV: For development, we will likely want another script
#   that pulls a pruned/scrubbed production database from S3
#   and runs newer migrations on it (e.g. `clone-development-db.sh`)
