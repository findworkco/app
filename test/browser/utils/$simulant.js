// Load in our dependencies
var simulant = require('simulant');

// Re-expose Simulant to receive jQuery collections
// https://github.com/Rich-Harris/simulant/blob/v0.2.2/src/simulant.js#L24
exports.fire = function ($node, event, params) {
  // Perform our initial assumptions
  if ($node.length === 0) {
    throw new Error('`$simulant` received a `$node` that was empty. Please double check your jQuery selector');
  }

  // Extract our node and call Simulant
  var node = $node.get(0);
  simulant.fire(node, event, params);
};
