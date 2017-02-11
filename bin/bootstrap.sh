#!/usr/bin/env bash
# Exit on first error
set -e

# Install our dependencies
# DEV: This will automatically run `npm run build` on complete
npm install

# Decrypt our secrets
bin/decrypt-config.sh

# Install large vendor files (e.g. MaxMind)
bin/install-vendor-files.sh

# If there's a local database, then run our migrations
# TODO: Reconsider ordering/organization of scripts as `ENV=development`
#   seems like it doesn't belong in `bootstrap.sh`
db_name="find_work"
if psql "$db_name" --command "SELECT 'hai';" &> /dev/null; then
  ENV=development npm run migrate-latest
fi
