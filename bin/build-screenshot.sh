#!/usr/bin/env bash
# Exit on first error
set -e

# Verify ImageMagick and imagemin are installed
if ! which convert &> /dev/null; then
  echo "Expected \`ImageMagick\` to be installed but it was not. " 1>&2
  echo "Please install \`ImageMagick\` before using this script. (http://www.imagemagick.org/)" 1>&2
  exit 1
fi
if ! which imagemin &> /dev/null; then
  echo "Expected \`imagemin\` to be installed but it was not. " 1>&2
  echo "Please install \`imagemin\` before using this script. (\`npm install -g imagemin-cli\`)" 1>&2
  exit 1
fi

# Resolve our source image
src_file="gemini/screens/application-edit-show/default-large/Firefox.png"
if ! test -f "$src_file"; then
  echo "$src_file wasn't found. Please run \`npm run gemini-update\`" 1>&2
  exit 1
fi

# Crop and downsize our image
# DEV: We don't preserve the file in-memory to make debugging interim images easier
screenshot_file="public/images/screenshot.jpg"
convert "$src_file" -gravity Center -crop 960x+0+0 -resize x483 jpg:- | imagemin > "$screenshot_file"

# Convert our image to base64 and inject it into the SVG
screenshot_base64="$(base64 --wrap 0 "$screenshot_file")"
target_template="$(cat public/images/screenshot.src.svg)"
target_file="public/images/screenshot.svg"
echo "${target_template/\{\{base64-image\}\}/$screenshot_base64}" > "$target_file"
