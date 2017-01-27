// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('research-company-save', function (suite) {
  // DEV: We include nav to make sure it shows applications
  suite.load('/research-company', geminiUtils.SETUPS.DEFAULT)
    .setCaptureElements('body')
    .before(function runSearch (actions, find) {
      var formSelector = 'form[action="/research-company"]';
      actions.sendKeys(find(formSelector + ' input[name=company_name]'),
        'Mock company');
      actions.click(find(formSelector + ' button[type=submit]'));
    })
    .before(function unhoverButton (actions, find) {
      actions.mouseMove(find('body'), {x: 0, y: 0});
    })
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
