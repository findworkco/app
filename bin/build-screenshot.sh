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

# Verify we have the latest gemini assets
if ! test -f "gemini/screens/screenshots/large/large/Firefox.png"; then
  echo "Gemini screenshots weren't found. Please run \`npm run gemini-update\`" 1>&2
  exit 1
fi

# Crop/downsize our images
# DEV: We don't preserve the file in-memory to make debugging interim images easier
large_height="483"
src_large_file="gemini/screens/screenshots/large/large/Firefox.png"
screenshot_large_file="public/images/screenshots/large.jpg"
convert "$src_large_file" -gravity Center -crop 960x+0+0 -resize x"$large_height" jpg:- | imagemin > "$screenshot_large_file"

# Convert our image to base64 and inject it into the SVG
screenshot_base64="$(base64 --wrap 0 "$screenshot_large_file")"
target_template="$(cat public/images/screenshots/large.template.svg)"
target_file="public/images/screenshots/large.svg"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_base64}" > "$target_file"

# Repeat steps for small screenshots
small_width="175"
small_1_height="115"
small_1_offset="75"
small_2_1_height="242"
small_2_1_offset="206"
small_2_2_height="100"
small_2_2_offset="600"
src_small_1_file="gemini/screens/screenshots/small-1/small-1/Firefox.png"
screenshot_small_1_file="public/images/screenshots/small-1.jpg"
convert "$src_small_1_file" -resize "$small_width"x -gravity NorthWest -crop x"$small_1_height"+0+"$small_1_offset" jpg:- | imagemin > "$screenshot_small_1_file"
src_small_2_1_file="gemini/screens/screenshots/small-2/small-2/Firefox.png"
screenshot_small_2_1_file="public/images/screenshots/small-2-1.jpg"
convert "$src_small_2_1_file" -resize "$small_width"x -gravity NorthWest -crop x"$small_2_1_height"+0+"$small_2_1_offset" jpg:- | imagemin > "$screenshot_small_2_1_file"
src_small_2_2_file="gemini/screens/screenshots/small-2/small-2/Firefox.png"
screenshot_small_2_2_file="public/images/screenshots/small-2-2.jpg"
convert "$src_small_2_2_file" -resize "$small_width"x -gravity NorthWest -crop x"$small_2_2_height"+0+"$small_2_2_offset" jpg:- | imagemin > "$screenshot_small_2_2_file"

screenshot_base64="$(base64 --wrap 0 "$screenshot_small_1_file")"
target_template="$(cat public/images/screenshots/small-1.template.svg)"
target_file="public/images/screenshots/small-1.svg"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_base64}" > "$target_file"
screenshot_1_base64="$(base64 --wrap 0 "$screenshot_small_2_1_file")"
screenshot_2_base64="$(base64 --wrap 0 "$screenshot_small_2_2_file")"
target_template="$(cat public/images/screenshots/small-2.template.svg)"
target_file="public/images/screenshots/small-2.svg"
output="${target_template/\{\{base64-image-1\}\}/$screenshot_1_base64}"
output="${output/\{\{base64-image-2\}\}/$screenshot_2_base64}"
echo -n "$output" > "$target_file"
