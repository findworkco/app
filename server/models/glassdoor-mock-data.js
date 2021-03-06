// Load our dependencies
var fs = require('fs');
var Glassdoor = require('./glassdoor');

// Read our mock data
var fullResponseStr = fs.readFileSync(
  __dirname + '/../../test/server/utils/http-fixtures/glassdoor-200-full.json', 'utf8');
var emptyResponseStr = fs.readFileSync(
  __dirname + '/../../test/server/utils/http-fixtures/glassdoor-200-empty.json', 'utf8');
var googleResponseStr = fs.readFileSync(
  __dirname + '/../../test/server/utils/http-fixtures/glassdoor-200-google.json', 'utf8');

// Export company mock data resolver
exports.getByName = function (companyName) {
  // If there is no company name, return early
  if (!companyName) {
    return Glassdoor.getEmptyResult();
  }

  // Determine which response to send
  var responseStr = fullResponseStr;
  if (companyName === 'MissingNo') {
    responseStr = emptyResponseStr;
  } else if (companyName === 'Google') {
    responseStr = googleResponseStr;
  }

  // Parse and return mock data
  var responseObj = JSON.parse(responseStr);
  return Glassdoor._parseResponse(responseObj.response, companyName);
};

