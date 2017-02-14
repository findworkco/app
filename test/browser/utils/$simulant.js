// Load in our dependencies
var simulant = require('simulant');

// Re-expose Simulant to receive jQuery collections
// https://github.com/Rich-Harris/simulant/blob/v0.2.2/src/simulant.js#L24
exports.fire = function ($nodes, event, params) {
  // Perform our initial assumptions
  if ($nodes.length === 0) {
    throw new Error('`$simulant` received no `$nodes`. Please double check your jQuery selector');
  }

  // Call simulant on each of our nodes
  $nodes.each(function handleEach (i, node) {
    simulant.fire(node, event, params);
  });
};
