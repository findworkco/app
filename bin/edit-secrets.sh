#!/usr/bin/env bash
# Exit on first error
set -e

# Define our file
# DEV: If we ever get to multiple secret files, then use this variant
#   https://github.com/mozilla/sops/blob/1.14/examples/all_in_one/bin/edit-config-file.sh
filepath="config/static-secrets.enc.json"

# Load it into SOPS and run our sync script
sops "$filepath"
bin/decrypt-config.sh
