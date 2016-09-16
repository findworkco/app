#!/usr/bin/env bash
# Exit on first error
set -e

# Install our dependencies
# DEV: This will automatically run `npm run build` on complete
npm install

# Decrypt our secrets
bin/decrypt-config.sh
