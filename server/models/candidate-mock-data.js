// Load in our dependencies
var Candidate = require('./candidate');
var genericMockData = require('./generic-mock-data');

// Generate candidate map by ids
var candidatesById = {};
genericMockData.candidates.forEach(function saveCandidateById (candidate) {
  candidatesById[candidate.id] = candidate;
});

// Define candidate builder
function buildCandidate(candidateAttributes) {
  // Build and return our candidate
  // DEV: Unlike other mock data, we don't serialize here so it's 1:1 with main code
  var retVal = Candidate.build(candidateAttributes);
  return retVal;
}

// Export candidate mock data resolver
exports.getById = function (id) {
  return candidatesById.hasOwnProperty(id) ? buildCandidate(candidatesById[id]) : null;
};
