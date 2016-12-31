// Load in our dependencies
// DEV: We load `server/index.js` to prevent circular dependencies
void require('../../../server/index.js');
var genericMockData = require('../../../server/models/generic-mock-data');

// Re-expose fixture sets as `module.exports`
// DEV: We reuse our mocks in `generic-mock-data` to simplify maintenance
// DEV: We don't use `generic-mock-data` directly because it's a lengthy/complex path =/
module.exports = genericMockData.fixtures;
