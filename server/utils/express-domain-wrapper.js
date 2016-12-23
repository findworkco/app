// Based on https://gist.github.com/twolfson/c1de950ea28fcbf74be8962257bd75bc
// Load in our dependencies
var assert = require('assert');
var domain = require('domain');
var flatten = require('underscore').flatten;
var methods = require('methods');
var routerProto = require('express/lib/router/index.js');
var Route = require('express/lib/router/route.js');
var slice = Array.prototype.slice;

// Define our singleton constants
var monkeyPatchedExpress = false;

// Define and export our wrapper function
exports.monkeyPatchExpress = function (domainErrorCallback) {
  // If Express has already been monkey patched, then error out
  // TODO: Figure out how to get this limited to an Express instance
  if (monkeyPatchedExpress === true) {
    throw new Error('Express cannot be wrapped with domains twice as we refer to a server singleton. ' +
      'Please either update the code to use a `this.app` reference to remove multiple monkey patches');
  }
  monkeyPatchedExpress = true;

  // Define our domain helper
  function wrapControllerWithDomain(controller) {
    // Verify we recieved a non-error controller (i.e. not `(err, req, res, next)`)
    if (controller.length > 3) {
      throw new Error('Domain controller received an error handler but it\'s built only for non-error handlers. ' +
        'Error handlers should not be performing asynchronous work and thus don\'t need domains');
    }

    // Wrap our controller
    return function wrapControllerWithDomainFn (req, res, next) {
      // Based on https://nodejs.org/api/domain.html#domain_domain_run_fn_arg
      var controllerDomain = domain.create();
      controllerDomain.on('error', function handleError (err) {
        // Invoke our error handler
        // DEV: `next` is the same as the controller received so they can freely execute `next(err)`
        domainErrorCallback(err, req, res, next);
      });

      // Call our normal controller
      controllerDomain.run(function handleDomainRun () {
        controller.call(this, req, res, next);
      });
    };
  }

  // Monkey patch Express with domain handlers
  // https://github.com/expressjs/express/blob/4.14.0/lib/application.js#L467-L511
  // https://github.com/expressjs/express/blob/4.14.0/lib/router/route.js#L164-L210
  var _all = Route.prototype.all;
  Route.prototype.all = function (/*controller|controllerArr*/) {
    // Flatten all controllers into a single array
    // i.e. `.all(fn)` -> `arguments = handles = [fn]`
    //   `.all([fn1, fn2])` -> `arguments = [[fn1, fn2]]` -> `handles = [fn1, fn2]`
    var handles = flatten(slice.call(arguments));
    // Map our controllers with domain wrappers
    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];
      assert.strictEqual(typeof handle, 'function');
      if (handle.length <= 3) {
        handles[i] = wrapControllerWithDomain(handle);
      }
    }
    // Invoke original `all` as `.all([controller1, controller2]);`
    _all.call(this, handles);
  };
  methods.forEach(function wrapRouteMethods (method) {
    var _methodFn = Route.prototype[method];
    Route.prototype[method] = function (/*controller|controllerArr*/) {
      // Flatten all controllers into a single array
      // i.e. `.all(fn)` -> `arguments = handles = [fn]`
      //   `.all([fn1, fn2])` -> `arguments = [[fn1, fn2]]` -> `handles = [fn1, fn2]`
      var handles = flatten(slice.call(arguments));

      // Map our controllers with domain wrappers
      for (var i = 0; i < handles.length; i++) {
        var handle = handles[i];
        assert.strictEqual(typeof handle, 'function');
        if (handle.length <= 3) {
          handles[i] = wrapControllerWithDomain(handle);
        }
      }
      // Invoke original method as `[method]([controller1, controller2]);`
      _methodFn.call(this, handles);
    };
  });

  // DEV: We patch `Router` to prevent missing lower level invocations of `use`
  // https://github.com/expressjs/express/blob/4.14.0/lib/application.js#L186-L227
  // https://github.com/expressjs/express/blob/4.14.0/lib/router/index.js#L413-L468
  var _use = routerProto.use;
  routerProto.use = function (fn) {
    // Determine offset of controllers via original Express logic
    var offset = 0;
    var path = '/';

    // default path to '/'
    // disambiguate router.use([fn])
    if (typeof fn !== 'function') {
      var arg = fn;

      while (Array.isArray(arg) && arg.length !== 0) {
        arg = arg[0];
      }

      // first arg is the path
      if (typeof arg !== 'function') {
        offset = 1;
        path = fn;
      }
    }

    // Map our controllers with domain wrappers
    var args = flatten(slice.call(arguments));
    var callbacks = args;
    for (var i = offset; i < callbacks.length; i++) {
      var callback = callbacks[i];
      assert.strictEqual(typeof callback, 'function');
      if (callback.length <= 3) {
        args[i] = wrapControllerWithDomain(callback);
      }
    }

    // Invoke original `use` as `.use(path, [controller1, controller2]);`
    _use.apply(this, args);
  };
};
