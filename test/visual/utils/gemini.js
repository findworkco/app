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

// DEV: These methods don't work as desired =(
exports.resizeLargeScrollTop = function (actions, find) {
  actions.setWindowSize(1024, 200);
};
exports.resizeMediumScrollTop = function (actions, find) {
  actions.setWindowSize(640, 200);
};
exports.resizeSmallScrollTop = function (actions, find) {
  actions.setWindowSize(340, 200);
};
exports.resizeLargeScrollMiddle = function (actions, find) {
  actions.setWindowSize(1024, 200);
  actions.executeJS(function (window) { window.scroll(0, 200); });
};
exports.resizeMediumScrollMiddle = function (actions, find) {
  actions.setWindowSize(640, 200);
  actions.executeJS(function (window) { window.scroll(0, 200); });
};
exports.resizeSmallScrollMiddle = function (actions, find) {
  actions.setWindowSize(340, 200);
  actions.executeJS(function (window) { window.scroll(0, 200); });
};

// Define a helper to disable CSS transitions
exports.disableTransitions = function (actions, find) {
  actions.executeJS(function handleExecuteJS () {
    // https://github.com/twolfson/css-controls/blob/0.1.1/lib/css-controls.js#L35
    document.styleSheets[0].insertRule('* { transition: none !important; }',
      document.styleSheets[0].cssRules.length);
  });
};
