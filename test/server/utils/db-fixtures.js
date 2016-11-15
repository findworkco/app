// Define default fixtures
exports.DEFAULT_FIXTURES = ['candidate-default'];

// Define our fixtures as export keys
exports['candidate-default'] = {
  model: 'candidate',
  data: {
    email: 'mock-email@mock-domain.test',
    google_access_token: 'mock_access_token_fixtured'
  }
};
