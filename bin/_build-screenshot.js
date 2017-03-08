// Taken from https://gist.github.com/twolfson/4f7e7ec7d6969173d6a095f86e2d47c8
// Load in our dependencies
var assert = require('assert');
var fs = require('fs');
var functionToString = require('function-to-string');
var execSync = require('child_process').execSync;
var shellQuote = require('shell-quote').quote;
var wd = require('wd');
var geminiUtils = require('../test/visual/utils/gemini');

// Resolve our Firefox binary
// https://github.com/angular/protractor/issues/3750
var geminiYml = fs.readFileSync(__dirname + '/../.gemini.yml', 'utf8');
var FIREFOX_BIN = geminiYml.match(/firefox_binary: ([^\n]+)/)[1]; assert(FIREFOX_BIN);

// Verify we have our required commands
assert(execSync('which xwininfo'));
assert(execSync('which import'));

// Set our environment like our other scripts
process.env.DISPLAY = ':99';

// Create a folder for our screenshots
var screenshotDir = __dirname + '/../browser/images/screenshots';
try { fs.mkdirSync(screenshotDir); } catch (err) { /* Ignore errors */ }

// Define a function to gather screenshots
function gatherScreenshots(cb) {
  // Create our browser
  // DEV: Typically we would prefer callbacks over promises but chaining is quite nice
  var browser = wd.promiseChainRemote();

  // Add logging for feedback
  browser.on('status', function handleStatus (info) {
    console.log('Status:', info.trim());
  });
  browser.on('command', function handleCommand (eventType, command, response) {
    // If this is a response, ignore it
    if (eventType === 'RESPONSE') {
      return;
    }
    console.log('Command:', eventType, command, (response || ''));
  });

  // Verify there are no other Firefox instances in our display
  // xwininfo: Window id: 0x40 (the root window) (has no name)
  //   Root window id: 0x40 (the root window) (has no name)
  //   Parent window id: 0x0 (none)
  //      0 children.
  //      OR
  //      7 children:
  //      0x200038 "Firefox": ()  10x10+-100+-100  +-100+-100
  //      0x200023 "Mozilla Firefox": ("Navigator" "Firefox")  2560x1944+0+0  +0+0
  //      0x20001f "Firefox": ("firefox" "Firefox")  200x200+0+0  +0+0
  //      0x20001b "Firefox": ("firefox" "Firefox")  200x200+0+0  +0+0
  //      0x200009 (has no name): ()  1x1+-1+-1  +-1+-1
  //      0x200003 (has no name): ("Toplevel" "Firefox")  200x200+0+0  +0+0
  //      0x200001 "Firefox": ("firefox" "Firefox")  10x10+10+10  +10+10
  var xwininfoStr = execSync('xwininfo -root -children').toString('utf8');
  assert.notEqual(xwininfoStr.indexOf('0 children'), -1,
    'Other windows are open in our Xvfb instance. Please close them to guarantee a clean screenshot\n' +
    xwininfoStr);

  // Create our browser and collect our Xvfb info
  var firefoxWindowId;
  browser = browser
    .init({browserName: 'firefox', firefox_binary: FIREFOX_BIN})
    .then(function findWindowInDisplay () {
      // 0x200023 "Mozilla Firefox": ("Navigator" "Firefox")  2560x1944+0+0  +0+0
      console.log('Finding Firefox window...');
      xwininfoStr = execSync('xwininfo -root -children').toString('utf8');
      var firefoxWinInfo = xwininfoStr.match(/(0x[^ ]+) "Mozilla Firefox": \("Navigator" "Firefox"\)/);
      assert(firefoxWinInfo);
      firefoxWindowId = firefoxWinInfo[1];
    });

  // Perform our screenshot collection
  // DEV: Firefox will have a scrollbar if we don't make it tall enough (may require Xvfb size increase)
  //   Additionally, Firefox's nav bar is showing but that should be consistent enough to clip in screenshots
  //   If we ever get timing resize issues, see the original variant of the script
  //     https://github.com/twolfson/multi-image-mergetool/blob/d2611b752060b0173587cfe33618130351e6ba25/bin/_build-demo-screenshots.js
  function captureWindowViaXvfb(filepath) {
    // Example: import -window 0x200023 out.png
    // DEV: Ideally we would use `spawnSync` instead of `execSync` + `shellQuote` but this automatically throws errors
    // DEV: If you see black bars, please shut off `npm run develop`
    // DEV: We add `sleep 1` for waiting for resizes to kick in
    console.log('Taking screenshot "' + filepath + '"...');
    execSync('/bin/sleep 1');
    execSync(shellQuote(['import', '-window', firefoxWindowId, filepath]));
  }
  var setupUrlWithoutHostname = geminiUtils.getSetupUrl(
    '/application/abcdef-google-screenshot-uuid', geminiUtils.SETUPS.SCREENSHOT);
  browser = browser
    .get('http://localhost:9000' + setupUrlWithoutHostname)
    // https://github.com/admc/wd/blob/v1.1.1/lib/commands.js#L569-L577
    .setWindowSize(1024, 1600)
    .then(captureWindowViaXvfb.bind(this, screenshotDir + '/large.base.png'))
    .setWindowSize(640, 1600)
    .then(captureWindowViaXvfb.bind(this, screenshotDir + '/medium.base.png'))
    .setWindowSize(340, 1600)
    .execute(functionToString(function tweakScreenshot () {
      // Remove our posting URL and application date for compact screenshot
      var $postingUrlFormGroup = window.jQuery('label[for="posting_url"]').closest('.form-group');
      if (!$postingUrlFormGroup.length) { throw new Error('Unable to find `posting_url` form group'); }
      $postingUrlFormGroup.remove();
      var $applicationDateFormGroup = window.jQuery('label[for="application_date"]').closest('.form-group');
      if (!$applicationDateFormGroup.length) { throw new Error('Unable to find `application_date` form group'); }
      $applicationDateFormGroup.remove();

      // Expand our research company section
      window.jQuery('.research-company [data-toggle]').click();

      // Remove our reminder info box
      var $reminderInfo = window.jQuery('#waiting_for_response_reminder')
        .closest('.form-group').find('.section--info');
      if (!$reminderInfo.length) { throw new Error('Unable to find reminder info box'); }
      $reminderInfo.remove();
    }).body)
    .then(captureWindowViaXvfb.bind(this, screenshotDir + '/small.base.png'));

  // Close our our browser on finish
  browser
    .fin(function handleFin () { return browser.quit(); })
    .done(function handleDone () { cb(); });
}

// Gather our screenshots
gatherScreenshots(function handleError (err) {
  // If there was an error, throw it
  if (err) {
    throw err;
  }
});
