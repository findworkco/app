#!/usr/bin/env bash
# Exit on first error
set -e

# Install our Node.js dependencies
npm install --production --loglevel http

# Decrypt our secrets
bin/decrypt-config.sh

# Install large vendor files (e.g. MaxMind)
bin/install-vendor-files.sh

# Run our migrations
ENV=production npm run migrate-latest
