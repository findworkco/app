// Define our resize helpers
// DEV: Despite using a very tall height, we only capture until the body stops
exports.resizeLarge = function (actions, find) {
  actions.setWindowSize(1024, 1600);
};

exports.resizeMedium = function (actions, find) {
  actions.setWindowSize(640, 1600);
};

exports.resizeSmall = function (actions, find) {
  actions.setWindowSize(340, 1600);
};

// Define a helper to disable CSS transitions
exports.disableTransitions = function (actions, find) {
  actions.executeJS(function handleExecuteJS () {
    // https://github.com/twolfson/css-controls/blob/0.1.1/lib/css-controls.js#L35
    document.styleSheets[0].insertRule('* { transition: 0s all !important; }', document.styleSheets[0].cssRules.length);
  });
};
