# app [![wercker status](https://app.wercker.com/status/11dd669e8306e37c6bfbc982316d9267/s/master)](https://app.wercker.com/project/bykey/11dd669e8306e37c6bfbc982316d9267)
Web application for https://findwork.co/

## Getting started
To get a local copy running, perform the following steps:

```bash
# Clone the repository
git clone git@github.com:twolfson/find-work-app.git
cd find-work-app

# Install our dependencies and compile assets
# DEV: This will automatically run `npm run build` on complete
npm install

# Start our server
npm run start-develop
```

Our development server will be running at <http://localhost:9000/>

## Documentation
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

## Copyright
All rights reserved, Shoulders of Titans LLC
