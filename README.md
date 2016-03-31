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
npm start
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

### Visual testing
We have support for running visual tests locally. These can be useful when performing CSS refactors and verifying nothing unexpectedly changes.

To capture expected images, run:

```bash
# Start a Webdriver server
npm run start-webdriver

# Capture images
npm run gemini-update
```

To validate latest images against expected images, run:

```bash
npm run gemini-test
# On failure, an HTML report will be generated in `gemini-report`
```

To validate images via a GUI, run:

```bash
npm run gemini-gui
```

## Copyright
All rights reserved, Shoulders of Titans LLC
