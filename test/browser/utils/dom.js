// Load in our dependencies
var $ = require('jquery');
var jade = require('jade');
var multiline = require('multiline');

// Define our helpers
exports.init = function (includes, jadeMultilineFn, locals) {
  // Fallback our parameters
  if (typeof includes === 'function') {
    locals = jadeMultilineFn;
    jadeMultilineFn = includes;
    includes = [];
  }

  // Run our Mocha hooks
  before(function initFn () {
    // Extract our Jade and render it
    var jadeStrParts = includes.concat(multiline.stripIndent(jadeMultilineFn));
    var jadeStr = jadeStrParts.join('\n');
    var jadeFn = jade.compile(jadeStr);
    this.el = $.parseHTML('<div>' + jadeFn(locals) + '</div>')[0];

    // Pulled out of Backbone/Cheerio
    this.$el = $(this.el);
    this.$ = function (selector) {
      return this.$el.find(selector);
    };
  });
  after(function cleanup () {
    delete this.el;
    delete this.$el;
    delete this.$;
  });
};
