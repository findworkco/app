// Load in our dependencies
var gemini = require('gemini');
var geminiUtils = require('./utils/gemini').bind(gemini);

// Define our visual tests
gemini.suite('research-company-save', function (suite) {
  // DEV: We include nav to make sure it shows applications
  suite.load('/research-company', geminiUtils.SETUPS.DEFAULT)
    .before(function runSearch (actions, find) {
      var formSelector = 'form[action="/research-company"]';
      actions.sendKeys(find(formSelector + ' input[name=company_name]'),
        'Mock company');
      actions.click(find(formSelector + ' button[type=submit]'));
    })
    .setCaptureElements('body')
    .capture('default-large', geminiUtils.resizeLarge)
    .capture('default-medium', geminiUtils.resizeMedium)
    .capture('default-small', geminiUtils.resizeSmall);
});
