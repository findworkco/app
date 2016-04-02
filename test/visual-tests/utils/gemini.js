// DEV: Despite using a very tall height, we only capture until the body stops
exports.resizeLarge = function (actions, find) {
  actions.setWindowSize(1024, 1600);
};

exports.resizeSmall = function (actions, find) {
  actions.setWindowSize(340, 1600);
};
