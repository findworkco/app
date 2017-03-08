// Load in our dependencies
var $ = require('jquery');

// DEV: We need to manually test as we can't swap `devicePixelRatio` via Sinon

// When we bind our plugin
exports.init = function (containerEl) {
  // If we support retina
  // http://caniuse.com/#feat=devicepixelratio
  // https://jonsuh.com/blog/retina-image-replacement/
  if (window.devicePixelRatio && window.devicePixelRatio >= 2) {
    // Find all retina-supported images and bind them
    $(containerEl).find('img[data-src-2x]').each(function handleImg2x (i, imgEl) {
      imgEl.setAttribute('src', imgEl.getAttribute('data-src-2x'));
    });
  }
};
