#!/usr/bin/env bash
# Exit on first error
set -e

# Define our source and target
src_file="public/images/screenshots/large.svg"
target_file="public/images/screenshots/large.template.svg"

# Define helper for reading file
# DEV: We use `echo -n + cat` to strip trailing whitespace
read_file () {
  echo -n "$(cat "$1")"
}

# Replace the base64 encoded image with variable
read_file "$src_file" | sed -E "s/(base64,)[^\"]+/\1{{base64-image}}/g" > "$target_file"

# Repeat for small SVGs
src_file="public/images/screenshots/small-1.svg"
target_file="public/images/screenshots/small-1.template.svg"
read_file "$src_file" | sed -E "s/(base64,)[^\"]+/\1{{base64-image}}/"  > "$target_file"
src_file="public/images/screenshots/small-2.svg"
target_file="public/images/screenshots/small-2.template.svg"
read_file "$src_file" | sed -E "s/(base64,)[^{\"]+/\1{{base64-image-1}}/" | sed -E "s/(base64,)[^{\"]+/\1{{base64-image-2}}/" > "$target_file"
