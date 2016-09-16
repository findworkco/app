#!/usr/bin/env bash
# Exit on first error
set -e

# Install our Node.js dependencies
npm install --production --loglevel http

# Decrypt our secrets
bin/decrypt-config.sh
