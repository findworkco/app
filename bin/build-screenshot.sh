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

# Verify we have the latest visual assets
if ! test -f "browser/images/screenshots/large.base.png"; then
  echo "Retina screenshots weren't found. Please run \`node bin/_build-screenshot.js\` as documented in README" 1>&2
  exit 1
fi

# Crop/downsize our images
# DEV: We don't preserve the file in-memory to make debugging interim images easier
title_bar_height_2x="142"
large_width="555" # Resizes to 555
large_height="511" # Resizes to 473
src_large_file="browser/images/screenshots/large.base.png"
screenshot_large_1x_file="browser/images/screenshots/large@1x.jpg"
screenshot_large_2x_file="browser/images/screenshots/large@2x.jpg"
convert "$src_large_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($large_width*1))"x \
  -crop x"$(($large_height*1))"+0+0 \
  jpg:- | imagemin > "$screenshot_large_1x_file"
convert "$src_large_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($large_width*2))"x \
  -crop x"$(($large_height*2))"+0+0 \
  jpg:- | imagemin > "$screenshot_large_2x_file"

# Convert our image to base64 and inject it into the SVG
screenshot_1x_base64="$(base64 --wrap 0 "$screenshot_large_1x_file")"
screenshot_2x_base64="$(base64 --wrap 0 "$screenshot_large_2x_file")"
target_template="$(cat browser/images/screenshots/large.template.svg)"
target_1x_file="browser/images/screenshots/large@1x.svg"
target_2x_file="browser/images/screenshots/large@2x.svg"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_1x_base64}" > "$target_1x_file"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_2x_base64}" > "$target_2x_file"

# Repeat steps for medium screenshots
medium_width="307"
medium_height="270"
medium_offset="153"
src_medium_file="browser/images/screenshots/medium.base.png"
screenshot_medium_1x_file="browser/images/screenshots/medium@1x.jpg"
screenshot_medium_2x_file="browser/images/screenshots/medium@2x.jpg"
convert "$src_medium_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($medium_width*1))"x \
  -crop x"$(($medium_height*1))"+0+"$(($medium_offset*1))" \
  jpg:- | imagemin > "$screenshot_medium_1x_file"
convert "$src_medium_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($medium_width*2))"x \
  -crop x"$(($medium_height*2))"+0+"$(($medium_offset*2))" \
  jpg:- | imagemin > "$screenshot_medium_2x_file"

screenshot_1x_base64="$(base64 --wrap 0 "$screenshot_medium_1x_file")"
screenshot_2x_base64="$(base64 --wrap 0 "$screenshot_medium_2x_file")"
target_template="$(cat browser/images/screenshots/medium.template.svg)"
target_1x_file="browser/images/screenshots/medium@1x.svg"
target_2x_file="browser/images/screenshots/medium@2x.svg"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_1x_base64}" > "$target_1x_file"
echo -n "${target_template/\{\{base64-image\}\}/$screenshot_2x_base64}" > "$target_2x_file"

# Repeat steps for small screenshots
small_width="175"
small_1_height="242"
small_1_offset="164"
small_2_height="100"
small_2_offset="498"
src_small_1_file="browser/images/screenshots/small.base.png"
screenshot_small_1_1x_file="browser/images/screenshots/small-1@1x.jpg"
screenshot_small_1_2x_file="browser/images/screenshots/small-1@2x.jpg"
convert "$src_small_1_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($small_width*1))"x \
  -crop x"$(($small_1_height*1))"+0+"$(($small_1_offset*1))" \
  jpg:- | imagemin > "$screenshot_small_1_1x_file"
convert "$src_small_1_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($small_width*2))"x \
  -crop x"$(($small_1_height*2))"+0+"$(($small_1_offset*2))" \
  jpg:- | imagemin > "$screenshot_small_1_2x_file"
src_small_2_file="browser/images/screenshots/small.base.png"
screenshot_small_2_1x_file="browser/images/screenshots/small-2@1x.jpg"
screenshot_small_2_2x_file="browser/images/screenshots/small-2@2x.jpg"
convert "$src_small_2_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($small_width*1))"x \
  -crop x"$(($small_2_height*1))"+0+"$(($small_2_offset*1))" \
  jpg:- | imagemin > "$screenshot_small_2_1x_file"
convert "$src_small_2_file" \
  -gravity NorthWest -crop +0+"$title_bar_height_2x" \
  -resize "$(($small_width*2))"x \
  -crop x"$(($small_2_height*2))"+0+"$(($small_2_offset*2))" \
  jpg:- | imagemin > "$screenshot_small_2_2x_file"

screenshot_1_1x_base64="$(base64 --wrap 0 "$screenshot_small_1_1x_file")"
screenshot_2_1x_base64="$(base64 --wrap 0 "$screenshot_small_2_1x_file")"
screenshot_1_2x_base64="$(base64 --wrap 0 "$screenshot_small_1_2x_file")"
screenshot_2_2x_base64="$(base64 --wrap 0 "$screenshot_small_2_2x_file")"
target_template="$(cat browser/images/screenshots/small.template.svg)"
target_1x_file="browser/images/screenshots/small@1x.svg"
target_2x_file="browser/images/screenshots/small@2x.svg"
output="${target_template/\{\{base64-image-1\}\}/$screenshot_1_1x_base64}"
output="${output/\{\{base64-image-2\}\}/$screenshot_2_1x_base64}"
echo -n "$output" > "$target_1x_file"
output="${target_template/\{\{base64-image-1\}\}/$screenshot_1_2x_base64}"
output="${output/\{\{base64-image-2\}\}/$screenshot_2_2x_base64}"
echo -n "$output" > "$target_2x_file"
