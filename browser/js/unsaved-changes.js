// Load in our dependencies
var $ = require('jquery');

// DEV: This must be manually tested due to `beforeunload`. Here are our scenarios:
// - Visit/leave page with no changes (should not message)
// - Edit page and leave via browser navigation (should message)
// - Edit page and perform "Save changes" (should not message)
// - Page which temporarily disables input on load (application edit, should not message)

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all forms that want to prevent unsaved changes
  $(containerEl).find('[data-unsaved-changes]').each(function handleUnsavedChangesForm (i, formEl) {
    // Serialize our form's contents
    // DEV: We could roll our own serialization but we won't save many lines of code
    //   If we want to, see the following:
    //   https://api.jquery.com/input-selector/
    //   https://github.com/simsalabim/sisyphus/blob/v1.1.3/sisyphus.js#L216-L218
    var $formEl = $(formEl);
    var originalContents = $formEl.serialize();

    // When there is a submit request, flag our boolean to ignore unload
    // https://github.com/simsalabim/sisyphus/blob/v1.1.3/sisyphus.js#L462-L476
    // DEV: We could add `data-ignore-unsaved-changes` to buttons/links (e.g. delete, "Go back")
    //   but this setup should be fine for now
    var isSubmitRequest = false;
    formEl.addEventListener('submit', function handleSubmit (evt) {
      isSubmitRequest = true;
    });

    // When an unload event is requested
    // http://stackoverflow.com/a/4376615
    window.addEventListener('beforeunload', function handleBeforeunload (evt) {
      // If a submit request is occurring, then allow event through
      if (isSubmitRequest) {
        return;
      }

      // If we have unsaved changes, then warn our user
      // https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
      var currentContents = $formEl.serialize();
      if (originalContents !== currentContents) {
        evt.returnValue = 'There are unsaved changes on the page. Please save or undo changes before leaving';
      }
    });
  });
};
