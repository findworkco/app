#!/usr/bin/env bash
# If we aren't in `/vagrant/app`
if test "$PWD" != "/vagrant/app"; then
  # Navigate to `/vagrant/app` and re-execute ourself in a subshell context
  # DEV: We skip `set -e` since this is typicall executed via `.`
  # DEV: We use a subshell to allow for forking (`&`), `wait`, and signals to work properly (otherwise, we exit `ssh`)
  cd /vagrant/app
  bin/quick-start.sh
# Otherwise, start a development server
# DEV: Eventually we should launch other processes concurrently (e.g. `kue`)
else
  # Exit on first error
  set -e

  # Set up handlers for signals from user
  # http://unix.stackexchange.com/a/146770
  handle_sigint () {
    set +e
    kill -s SIGINT "$server_pid"
  }
  handle_sigterm () {
    set +e
    kill -s SIGTERM "$server_pid"
  }
  trap handle_sigint SIGINT
  trap handle_sigterm SIGTERM

  # Run our development server
  npm run start-develop &
  server_pid="$!"

  # Wait for all child processes to exit before exiting ourself
  # DEV: This guarantees our `trap` handlers complete
  wait
fi

