#!/usr/bin/env bash
# Exit on first error
set -e

# Define our source and target
src_file="public/images/screenshot.svg"
target_file="public/images/screenshot.src.svg"

# Replace the base64 encoded image with variable
sed -E "s/(base64,)[^\"]+/\1{{base64-image}}/g" "$src_file" > "$target_file"
