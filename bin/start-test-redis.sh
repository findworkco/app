#!/usr/bin/env bash
# Exit on first error
set -e

# Start our test redis instance
# Based on https://github.com/antirez/redis/blob/2.8.4/redis.conf
redis-server - <<EOF
daemonize yes
port 6401
pidfile test-redis.pid
bind 127.0.0.1
EOF
