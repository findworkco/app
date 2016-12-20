// Load in our dependencies
var Candidate = require('./candidate');
var genericMockData = require('./generic-mock-data');

// Generate application map by ids
var candidatesById = {};
genericMockData.candidates.forEach(function saveCandidateById (candidate) {
  candidatesById[candidate.id] = candidate;
});

// Define application builder
function buildCandidate(candidateAttributes) {
  // Build our candidate
  // http://docs.sequelizejs.com/en/latest/docs/instances/#values-of-an-instance
  var retVal = Candidate.build(candidateAttributes).get({plain: true, clone: true});

  // Return our retVal
  return retVal;
}

// Export application mock data resolver
exports.getById = function (id) {
  return candidatesById.hasOwnProperty(id) ? buildCandidate(candidatesById[id]) : null;
};
