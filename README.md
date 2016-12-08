# app [![wercker status](https://app.wercker.com/status/11dd669e8306e37c6bfbc982316d9267/s/master)](https://app.wercker.com/project/bykey/11dd669e8306e37c6bfbc982316d9267)
Web application for https://findwork.co/

## Getting Started
To get a local copy running, run the following within the [scripts][] repo:

```bash
# Log into the Vagrant machine
vagrant ssh

# Navigate to our directory
cd /vagrant/app

# Install our dependencies and compile assets
CONFIG_COPY_ONLY=TRUE bin/bootstrap.sh
# To decrypt our secrets (e.g. production db password), use
#   CONFIG_COPY_ONLY=FALSE bin/bootstrap.sh

# Set up a local database
bin/create-local-db.sh

# Start our server
npm run start-develop

# On future runs, the server can be started quickly via:
# vagrant ssh; . quick-start-app.sh
# `. quick-start-app.sh` is shorthand for `cd /vagrant/app; bin/quick-start.sh`
```

Our development server will be running at <http://localhost:9000/>

[scripts]: https://github.com/twolfson/find-work-scripts

## Documentation
### Dependencies
To minimize build size, we keep development and testing dependencies separate. Here's our breakdown in `package.json`:

- `dependencies` - Packages required to run server
- `optionalDependencies` - Packages to compile browser files (e.g. images, JS)
- `devDependencies` - Packages for testing and development (e.g. `gemini`, `nodemon`)

### Building files
We offer compilation of CSS/JS via 2 means:

**Single run:** Compile our files only once

```bash
npm run build
```

**Continuous:** Compile our files and re-compile when they change

```bash
npm run develop
```

### Provisioning database
To reset the local development database, run the following:

```bash
# Destroy our current database
dropdb find_work

# Create our database
bin/create-local-db.sh
```

### Creating new migrations
To create a new migration, copy our placeholder our file with the next sequential id. It will be automatically identified as the next migration to run:

```bash
cp server/migrations/0001-placeholder.js server/migrations/XXXX-my-new-migration.js
# cp server/migrations/0001-placeholder.js server/migrations/0002-add-candidates-table.js
```

### Running migrations
Migrations are automatically run by `bootstrap.sh` and `create-local-db.sh` but to run them alone, run the following:

```bash
ENV=development npm run migrate-latest
# To run migrations for testing, use `bin/reset-tet-db.sh`
```

We provide other scripts for rolling back migrations:

```bash
# Roll back last run migration
ENV=development npm run migrate-undo
# Roll back all migrations (not recommended as it wipes database)
ENV=development npm run migrate-undo-all
```

### Connecting to a database
To connnect to the development database, the simplest way is:

```bash
# Log into the Vagrant machine
vagrant ssh

# Use the PostgreSQL CLI on `find_work` database (auto-uses `vagrant` user and proper port)
psql find_work
```

To connect from the host machine to the development database, we suggest using `pg_service.conf`. Here's a gist with instructions:

https://gist.github.com/twolfson/5cd240862112ef4918bd

**Example config:**

```
[vagrant_app]
host=localhost
port=5500
dbname=find_work
user=vagrant
password=vagrant
```

**Usage:**

```bash
psql service=vagrant_app
```

To connect to the production database, we suggest using `ssh` and the `psql` CLI to prevent leaking unencrypted passwords:

```bash
# SSH into our production machine
ssh digital-my-server

# Use CLI with PostgreSQL super user on `find_work` database
sudo su postgres --shell /bin/bash --command "psql find_work"
```

### Managing secrets
We use SOPS to manage secrets across all of our repositories. Our configuration is based on:

https://github.com/mozilla/sops/tree/1.14/examples/all_in_one

To edit this repo's secrets, get SOPS installed as instructed by:

https://github.com/twolfson/find-work-scripts#editing-secrets

Once SOPS is setup, we use the following steps to edit our secrets:

```bash
# Edit `config/static-secrets.enc.json` and output decrypted content to `config/static-secrets.json`
bin/edit-secrets.sh
```

### Automated refresh
We integrate with LiveReload by starting a LiveReload server when `npm run develop` is running.

As a result, if you enable/install a LiveReload browser extension, then it will automatically reload the page when files change.

http://livereload.com/extensions/

### Automated restart
We integrate with `nodemon` to allow for automated restarting of the server when a file changes. To start the server with automated restarts, run:

```bash
npm run start-develop
```

### Testing
To run our entire test suite (excluding visual tests), run the following:

```bash
# On first test runs, create a test database
bin/reset-test-db.sh

# Run our test suite
npm test
```

To run smaller parts, see our `package.json` or type `npm run` to get a listing of scripts:

```bash
npm run
# npm run lint
# npm run test-server
```

### Visual testing
We have support for running visual tests locally. These can be useful when performing CSS refactors and verifying nothing unexpectedly changes.

To capture expected images, run:

```bash
# Start a Webdriver server
npm run start-webdriver

# Capture images
npm run gemini-update
# To filter to specific tests, use `--grep`:
# npm run gemini-update -- --grep hello
```

To validate latest images against expected images, run:

```bash
npm run gemini-test
# On failure, an HTML report will be generated in `gemini-report`
# To filter to specific tests, use `--grep`:
# npm run gemini-test -- --grep hello
```

To validate images via a GUI, run:

```bash
npm run gemini-gui
```

### Landing page screenshots
We automate generation of our screenshots for the landing page. To update the screenshots, run:

```bash
# Capture latest images
npm run gemini-update

# Compile our screenshots
bin/build-screenshot.sh
```

If we have manually edited the SVG, then update its template via:

```bash
bin/build-screenshot-template.sh
```

### Mobile device access
During development, we might want to preview changes on a mobile device (e.g. phone, tablet). To do this, run the following:

```bash
# Determine Vagrant IP address
ps ax | grep redir | grep cport=9000
# Example:
#   redir --laddr=127.0.0.1 --lport=9000 --caddr=10.0.1.4 --cport=9000
#   Host address is 10.0.1.4

# Determine local IP address
ifconfig | grep wlan -A 10
# Example:
#   wlan0     Link encap:Ethernet  HWaddr xx:xx:xx:xx:xx:xx
#             inet addr:10.0.0.1  Bcast:10.0.0.255  Mask:255.255.255.0
#   Local address is 10.0.0.1

# Set up a port redirect to allow any incoming connections
# DEV: Don't run this too long as it exposes the local service to the world
redir --laddr=0.0.0.0 --lport=9001 --caddr={{host_address}} --cport 9000
# Example: redir --laddr=0.0.0.0 --lport=9001 --caddr=10.0.1.4 --cport 9000

# Now open the local IP address on the mobile device
# Example: http://10.0.0.1:9001/
```

### Setting up a production database
We are currently running our database on the same server as our application. As a result, we can use `bin/create-local-db.sh`. Here's an example provisioning:

```bash
# SSH into the production machine
ssh digital-my-server

# Switch to the `postgres` user
sudo su postgres --shell /bin/bash

# Navigate to our application directory
cd ~ubuntu/app/main

# Create our local database
bin/create-local-db.sh
```

### Debugging Wercker
Sometimes `vagrant-lxc` and Wercker can have different experiences during tests. To start a Docker instance locally (same platform as Wercker), run the following:

```bash
# Run our container with the local directory mounted to /vagrant
docker run --interactive --tty --volume $PWD:/vagrant ubuntu:14.04 /bin/bash

# Navigate to our /vagrant directory
cd /vagrant

# Run steps in `wercker.yml` by hand

# To connect to the existing shell, run:
# docker exec --interactive --tty 0d7bd9cac25b /bin/bash
#   Id (e.g. 0d7bd9cac25b) found via `bash` shell or `docker images --all`

# To destroy the container, run:
# docker rm 0d7bd9cac25b
#   Id (e.g. 0d7bd9cac25b) found via `bash` shell or `docker images --all`
```

## Copyright
All rights reserved, Shoulders of Titans LLC
