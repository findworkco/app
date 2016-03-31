#!/usr/bin/env bash
# Exit on first error
set -e

# If we don't see gulp, complain about how to run this script
if ! which gulp &> /dev/null; then
  echo "gulp was not found. Please run this script via \`npm run test-verify-images-optimized\`" 1>&2
  exit 1
fi

# Run our image build
gulp build-images

# Verify our git diff is clean
if test "$(git diff -- public/images)" != ""; then
  echo "Images were not optimized before saving. Please run \`npm run build\` to resolve this" 1>&2
  exit 1
fi
