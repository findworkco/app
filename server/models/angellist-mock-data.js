// Load our dependencies
var fs = require('fs');
var AngelList = require('./angellist');

// Read our mock data
var fullResponseStr = fs.readFileSync(
  __dirname + '/../../test/server/utils/http-fixtures/angellist-startups-id-200-full.json', 'utf8');
var googleResponseStr = fs.readFileSync(
  __dirname + '/../../test/server/utils/http-fixtures/angellist-startups-id-200-google.json', 'utf8');

// Export company mock data resolver
exports.getByName = function (companyName) {
  // If there is no company name, return early
  if (!companyName) {
    return AngelList.getEmptyResult();
  }

  // Determine which response to send
  var responseStr = fullResponseStr;
  if (companyName === 'Google') {
    responseStr = googleResponseStr;
  }

  // Parse and return mock data
  var responseObj = JSON.parse(responseStr);
  return AngelList._parseResponse(responseObj, companyName);
};
