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
large_width="555"
large_height="473"
src_large_file="gemini/screens/screenshots/large/large/Firefox.png"
screenshot_large_file="browser/images/screenshots/large.jpg"
convert "$src_large_file" \
  -resize "$large_width"x \
  -gravity NorthWest -crop x"$large_height"+0+0 \
  jpg:- | imagemin > "$screenshot_large_file"

# Convert our image to base64 and inject it into the SVG
screenshot_base64="$(base64 --wrap 0 "$screenshot_large_file")"
target_template="$(cat browser/images/screenshots/large.template.svg)"
target_file="browser/images/screenshots/large.svg"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_base64}" > "$target_file"

# Repeat steps for medium screenshots
medium_width="307"
medium_height="270"
medium_offset="118"
src_medium_file="gemini/screens/screenshots/medium/medium/Firefox.png"
screenshot_medium_file="browser/images/screenshots/medium.jpg"
convert "$src_medium_file" \
  -resize "$medium_width"x \
  -gravity NorthWest -crop x"$medium_height"+0+"$medium_offset" \
  jpg:- | imagemin > "$screenshot_medium_file"

screenshot_base64="$(base64 --wrap 0 "$screenshot_medium_file")"
target_template="$(cat browser/images/screenshots/medium.template.svg)"
target_file="browser/images/screenshots/medium.svg"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_base64}" > "$target_file"

# Repeat steps for small screenshots
small_width="175"
small_1_height="242"
small_1_offset="126"
small_2_height="100"
small_2_offset="483"
src_small_1_file="gemini/screens/screenshots/small/small/Firefox.png"
screenshot_small_1_file="browser/images/screenshots/small-1.jpg"
convert "$src_small_1_file" \
  -resize "$small_width"x \
  -gravity NorthWest -crop x"$small_1_height"+0+"$small_1_offset" \
  jpg:- | imagemin > "$screenshot_small_1_file"
src_small_2_file="gemini/screens/screenshots/small/small/Firefox.png"
screenshot_small_2_file="browser/images/screenshots/small-2.jpg"
convert "$src_small_2_file" \
  -resize "$small_width"x \
  -gravity NorthWest -crop x"$small_2_height"+0+"$small_2_offset" \
  jpg:- | imagemin > "$screenshot_small_2_file"

screenshot_1_base64="$(base64 --wrap 0 "$screenshot_small_1_file")"
screenshot_2_base64="$(base64 --wrap 0 "$screenshot_small_2_file")"
target_template="$(cat browser/images/screenshots/small.template.svg)"
target_file="browser/images/screenshots/small.svg"
output="${target_template/\{\{base64-image-1\}\}/$screenshot_1_base64}"
output="${output/\{\{base64-image-2\}\}/$screenshot_2_base64}"
echo -n "$output" > "$target_file"
