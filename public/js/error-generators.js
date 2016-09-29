// When we bind our plugin
exports.init = function () {
  // Define window level error generators
  window.errorGenerators = {
    // Test via: setTimeout(function () { errorGenerators.syncError(); }, 100);
    // DEV: Sync errors don't get sent to Sentry when run directly by console
    syncError: function () {
      throw new Error('Sync error');
    },
    // Test via: errorGenerators.asyncError();
    asyncError: function () {
      setTimeout(function handleSetTimeout () {
        throw new Error('Async error');
      }, 100);
    }
  };
};
