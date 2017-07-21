#!/usr/bin/env bash
# Exit on first error
set -e

# Download, extract, and checksum MaxMind's GeoIP database
# https://dev.maxmind.com/geoip/geoip2/geolite2/
# DEV: We use `curl` for one less dependency in Wercker
# DEV: We previously did an md5 checksum but we're now trusting HTTPS more than that
cd vendor
mmdb_file="GeoLite2-City.mmdb"
if ! test -f "$mmdb_file"; then
  echo "Downloading MaxMind database..." 1>&2
  curl https://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz \
    | gunzip > "$mmdb_file"
else
  echo "MaxMind database found. Skipping download" 1>&2
fi
cd -
