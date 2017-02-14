// Load in our dependencies
// DEV: We need to re-expose `wysiwyg` to window since `wysiwyg-editor.js` doesn't resolve it via `require`
var $ = require('jquery');
window.wysiwyg = require('wysiwyg.js/src/wysiwyg.js');
void require('wysiwyg.js/src/wysiwyg-editor.js');

// When we bind our plugin
exports.init = function () {
  // Find all WYSIWYG textareas and bind them
  // http://codepen.io/twolfson/pen/XdbaVo
  // DEV: We use `data-wysiwyg-input` as `wysiwyg.js` wants to use `data-wysiwyg` for itself
  $('[data-wysiwyg-input]').wysiwyg({
    toolbar: 'top-selection',
    buttons: {
      bold: {
        title: 'Bold (Ctrl+B)',
        image: '<i class="fa fa-bold"></i>',
        hotkey: 'b'
      },
      italic: {
        title: 'Italic (Ctrl+I)',
        image: '<i class="fa fa-italic"></i>',
        hotkey: 'i'
      },
      underline: {
        title: 'Underline (Ctrl+U)',
        image: '<i class="fa fa-underline"></i>',
        hotkey: 'u'
      },
      insertlink: {
        title: 'Insert link',
        image: '<i class="fa fa-link"></i>'
      },
      indent: {
        title: 'Indent',
        image: '<i class="fa fa-indent"></i>',
        showselection: false // Hide from selection
      },
      outdent: {
        title: 'Outdent',
        image: '<i class="fa fa-outdent"></i>',
        showselection: false // Hide from selection
      },
      orderedList: {
        title: 'Ordered list',
        image: '<i class="fa fa-list-ol"></i>',
        showselection: false // Hide from selection
      },
      unorderedList: {
        title: 'Unordered list',
        image: '<i class="fa fa-list-ul"></i>',
        showselection: false // Hide from selection
      },
      removeformat: {
        title: 'Remove format',
        image: '<i><u>T</u><sub>x</sub></i>'
      }
    },
    submit: {
      title: 'Submit',
      image: '\uf00c'
    },
    followLink: {
      title: 'Follow link',
      image: '<i class="fa fa-external-link"></i>'
    }
  });
};
