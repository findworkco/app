#!/usr/bin/env bash
# Based on https://github.com/twolfson/multi-image-mergetool/blob/1.28.0/bin/test-browser-update-screenshots-signature.sh
# Exit on first error
set -e

# Enable globstar
shopt -s globstar

# Notify user about updating values
echo "Updating visual signature..." 1>&2

# Verify we have our dependencies
if ! which parallel &> /dev/null; then
  echo "\`parallel\` command not found. Please install GNU parallel before continuing" 1>&2
  exit 1
fi
if ! which identify &> /dev/null; then
  echo "\`identify\` command not found. Please install ImageMagick before continuing" 1>&2
  exit 1
fi

# Move into our Gemini directory
cd gemini/screens

# Retrieve image signatures via ImageMagick
# http://www.imagemagick.org/script/identify.php
# http://www.imagemagick.org/script/escape.php
# DEV: We write signature first so alignment is consistent
# image.png -> abcdef12345... path/to/image.png
parallel --keep-order "identify -format \"%# %i\" \"{}\"" ::: **/*.png > contents.sig

# Move back to the previous directory
cd - &> /dev/null

# Relocate our signature
mv gemini/screens/contents.sig test/visual/contents.sig

# Notify user about completion
echo "Visual signature updated" 1>&2
