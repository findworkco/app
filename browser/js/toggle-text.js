// Load in our dependencies
var assert = require('assert');
var $ = require('jquery');

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all text toggle triggers
  // DEV: We are initially only doing `collapse` as we don't know what other events are
  var $containerEl = $(containerEl);
  $containerEl.find('[data-toggle="collapse"][data-target][data-collapse-text]').each(
      function handleToggleTrigger (i, triggerEl) {
    // Resolve our elements
    var $triggerEl = $(triggerEl);
    var $targetEl = $containerEl.find($triggerEl.data('target'));
    assert($targetEl.length);

    // When our collapse is triggered, toggle our trigger's content
    // http://getbootstrap.com/javascript/#collapse
    var expandText = $triggerEl.text();
    var collapseText = $triggerEl.data('collapse-text');
    $targetEl.on('hide.bs.collapse', function () {
      $triggerEl.text(expandText);
    });
    $targetEl.on('show.bs.collapse', function () {
      $triggerEl.text(collapseText);
    });
  });
};
