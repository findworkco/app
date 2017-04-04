// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define common action
function expandResearchCompany(actions, find) {
  geminiUtils.resizeSmall(actions, find);
  actions.executeJS(function handleExecuteJS (window) {
    window.jQuery('.research-company [data-toggle]').click();
  });
}

// Define our visual tests
gemini.suite('application-edit-show', function (suite) {
  var nameSelector = '#content input[name=name]';
  gemini.suite('saved-for-later', function (child) {
    // DEV: We include nav to make sure we have selected the proper link
    gemini.suite('default', function (child) {
      child.load('/application/abcdef-intertrode-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall)
        .capture('default-small-expanded', expandResearchCompany);
    });
    gemini.suite('invalid', function (child) {
      // DEV: These include validation errors for `id/isUUID`, we could ignore these
      //   but we feel it's sanest to keep them in the tests
      child.load('/application/abcdef-intertrode-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .before(function clearNameAndSubmitForm (actions, find) {
          geminiUtils.clear(actions, nameSelector);
          actions.click('form[action="/application/abcdef-intertrode-uuid"] button[type=submit]');
        })
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
  });
  gemini.suite('upcoming-interview', function (child) {
    gemini.suite('default', function (child) {
      // DEV: We include nav to make sure we have selected the proper link
      child.load('/application/abcdef-umbrella-corp-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall)
        .capture('default-small-expanded', expandResearchCompany);
    });
    gemini.suite('invalid', function (child) {
      child.load('/application/abcdef-umbrella-corp-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .before(function clearNameAndSubmitForm (actions, find) {
          geminiUtils.clear(actions, nameSelector);
          actions.click('form[action="/application/abcdef-umbrella-corp-uuid"] button[type=submit]');
        })
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
  });
  gemini.suite('waiting-for-response', function (child) {
    gemini.suite('default', function (child) {
      // DEV: We include nav to make sure we have selected the proper link
      child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall)
        .capture('default-small-expanded', expandResearchCompany);
    });
    gemini.suite('invalid', function (child) {
      child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .before(function clearNameAndSubmitForm (actions, find) {
          geminiUtils.clear(actions, nameSelector);
          actions.click('form[action="/application/abcdef-sky-networks-uuid"] button[type=submit]');
        })
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
  });
  gemini.suite('received-offer', function (child) {
    gemini.suite('default', function (child) {
      // DEV: We include nav to make sure we have selected the proper link
      child.load('/application/abcdef-black-mesa-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall)
        .capture('default-small-expanded', expandResearchCompany);
    });
    gemini.suite('invalid', function (child) {
      child.load('/application/abcdef-black-mesa-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .before(function clearNameAndSubmitForm (actions, find) {
          geminiUtils.clear(actions, nameSelector);
          actions.click('form[action="/application/abcdef-black-mesa-uuid"] button[type=submit]');
        })
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
  });
  gemini.suite('archive', function (child) {
    gemini.suite('default', function (child) {
      // DEV: We include nav to make sure we selected the proper link
      child.load('/application/abcdef-monstromart-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall)
        .capture('default-small-expanded', expandResearchCompany);
    });
    gemini.suite('invalid', function (child) {
      child.load('/application/abcdef-monstromart-uuid', geminiUtils.SETUPS.DEFAULT)
        .setCaptureElements('body')
        .before(function clearNameAndSubmitForm (actions, find) {
          geminiUtils.clear(actions, nameSelector);
          actions.click('form[action="/application/abcdef-monstromart-uuid"] button[type=submit]');
        })
        .capture('default-large', geminiUtils.resizeLarge)
        .capture('default-medium', geminiUtils.resizeMedium)
        .capture('default-small', geminiUtils.resizeSmall);
    });
  });

  // One-off visual tests
  // Verify content sync for input works and looks good
  gemini.suite('title-sync', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .before(function updateTitle (actions, find) {
        // Update our title
        // DEV: `sendKeys` doesn't clear original text so we use `clear` first
        // https://github.com/admc/wd/blob/v0.4.0/lib/element-commands.js#L279-L286
        // https://github.com/gemini-testing/gemini/blob/v4.13.2/lib/tests-api/actions-builder.js#L219-L247
        // https://github.com/gemini-testing/gemini/blob/v4.13.2/lib/tests-api/actions-builder.js#L400-L424
        geminiUtils.clear(actions, nameSelector);
        actions.sendKeys(nameSelector, 'Updated title');

        // Reset focus to the body
        actions.focus(find('body'));
      })
      .after(function resetForm (actions, find) {
        // DEV: We reset our form to prevent our beforeunload popup
        geminiUtils.clear(actions, nameSelector);
        actions.sendKeys(nameSelector, 'Sky Networks');
      })
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });

  // Verify listing multiple upcoming/past interviews looks good
  gemini.suite('no-past-interviews', function (child) {
    child.load('/application/abcdef-umbrella-corp-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('multiple-past-interviews', function (child) {
    child.load('/application/abcdef-globo-gym-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('no-upcoming-interviews', function (child) {
    child.load('/application/abcdef-sky-networks-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
  gemini.suite('multiple-upcoming-interviews', function (child) {
    child.load('/application/abcdef-stark-indy-uuid', geminiUtils.SETUPS.DEFAULT)
      .setCaptureElements('body')
      .capture('default-large', geminiUtils.resizeLarge)
      .capture('default-medium', geminiUtils.resizeMedium)
      .capture('default-small', geminiUtils.resizeSmall);
  });
});
