#!/usr/bin/env bash
# Exit on first error
set -e

# Download, extract, and checksum MaxMind's GeoIP database
# http://dev.maxmind.com/geoip/geoip2/geolite2/
# DEV: We use `curl` for one less dependency in Wercker
cd vendor
mmdb_file="GeoLite2-City.mmdb"
if ! test -f "$mmdb_file"; then
  echo "Downloading MaxMind database..." 1>&2
  curl http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz \
    | gunzip > "$mmdb_file"
  echo "1eacc9e92a218fc5491e021da372acb1 $mmdb_file" | md5sum --check -
else
  echo "MaxMind database found. Skipping download" 1>&2
fi
cd -
