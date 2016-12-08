// Load in our dependencies
// DEV: We need to re-expose `wysiwyg` to window since `wysiwyg-editor.js` doesn't resolve it via `require`
var $ = require('jquery');

// When we bind our plugin
exports.init = function () {
  // Find our page's menu and overlay
  var $menu = $('.layout__menu');
  var $overlay = $('.layout__menu__overlay');

  // Bind our toggle setup
  $(document.body).on('click', '[data-toggle=menu]', function handleClick (evt) {
    $menu.toggleClass('open');
    $overlay.toggleClass('open');

    // Force height to match entire body height
    // DEV: Without this, we will only cover top of page
    $menu[0].style.height = document.body.scrollHeight + 'px';
  });
};
