// Load in our dependencies
var _ = require('underscore');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpBuffer = require('gulp-buffer');
var gulpCsso = require('gulp-csso');
var gulpImagemin = require('gulp-imagemin');
var gulpSvgmin = require('gulp-svgmin');
var gulpLivereload = require('gulp-livereload');
var gulpNotify = require('gulp-notify');
var gulpSass = require('gulp-sass');
var gulpSourcemaps = require('gulp-sourcemaps');
var gulpUglify = require('gulp-uglify');
var gulpSizereport = require('gulp-sizereport');
var rimraf = require('rimraf');
var vinylSourceStream = require('vinyl-source-stream');
var watchify = require('watchify');

// Set up our configuration
var config = {
  allowFailures: false,
  minifyAssets: true
};

// Define our build tasks
gulp.task('build-clean', function clean (done) {
  // Remove all compiled files in `dist/`
  rimraf(__dirname + '/dist/', done);
});

gulp.task('build-css', function buildCss () {
  // Generate a stream that compiles SCSS to CSS
  // DEV: We return the pipe'd stream so gulp knows when we exit
  var cssStream = gulp.src('browser/css/index.scss')
    .pipe(gulpSass({
      style: 'nested'
    }));

  // If we are allowing failures, then log them
  // DEV: Desktop notifications are a personal preference
  //   If they get unwieldy, feel free to move to logging only
  //   But be sure to continue to emit an `end` event
  if (config.allowFailures) {
    cssStream.on('error', gulpNotify.onError());
  }

  // If we are minifying assets, then minify them
  if (config.minifyAssets) {
    cssStream = cssStream
      .pipe(gulpCsso())
      .pipe(gulpSizereport({gzip: true}));
  }

  // Output our CSS and notify LiveReload
  return cssStream
    .pipe(gulp.dest('dist/css'))
    .pipe(gulpLivereload());
});

gulp.task('build-images-svg', function buildImagesSvg () {
  // Optimize SVG files inline
  return gulp.src('browser/images/**/*.svg')
    .pipe(gulpSvgmin())
    .pipe(gulpSizereport({gzip: true}))
    .pipe(gulp.dest('browser/images'))
    .pipe(gulp.dest('dist/images'))
    .pipe(gulpLivereload());
});
gulp.task('build-images-non-svg', function buildImagesNonSvg () {
  // Optimize PNG/JPG files inline
  return gulp.src(['browser/images/**/*', '!browser/images/**/*.svg'])
    .pipe(gulpImagemin())
    .pipe(gulpSizereport({gzip: true}))
    .pipe(gulp.dest('browser/images'))
    .pipe(gulp.dest('dist/images'))
    .pipe(gulpLivereload());
});
gulp.task('build-images-vendor', function buildImagesVendor () {
  // Optimize vendor images and place them in the CSS folder
  return gulp.src(['bower_components/chosen-bootstrap/chosen-sprite*'])
    .pipe(gulpImagemin())
    .pipe(gulpSizereport({gzip: true}))
    .pipe(gulp.dest('dist/css'))
    .pipe(gulpLivereload());
});
gulp.task('build-images', ['build-images-svg', 'build-images-non-svg', 'build-images-vendor']);

// Create a browserify instance
// https://github.com/gulpjs/gulp/blob/v3.9.1/docs/recipes/browserify-uglify-sourcemap.md
// https://github.com/substack/watchify/tree/v3.7.0#watchifyb-opts
exports.browserifyOptions = {
  cache: {}, packageCache: {},
  debug: true, // Enable source maps
  transform: ['brfs', 'envify']
};
var browserifyObj = browserify(_.defaults({
  entries: __dirname + '/browser/js/index.js'
}, exports.browserifyOptions));
gulp.task('build-js', function buildJs () {
  // Bundle browserify content
  var jsStream = browserifyObj.bundle();

  // If we are allowing failures, then log them
  if (config.allowFailures) {
    jsStream.on('error', gulpNotify.onError());
  }

  // Coerce browserify output into a Vinyl object with buffer content
  jsStream = jsStream
    .pipe(vinylSourceStream('index.js'))
    .pipe(gulpBuffer());

  // Extract browserify inline sourcemaps into in-memory file
  jsStream = jsStream.pipe(gulpSourcemaps.init({loadMaps: true}));

  // If we are minifying assets, then minify them
  if (config.minifyAssets) {
    jsStream = jsStream
      .pipe(gulpUglify())
      .pipe(gulpSizereport({gzip: true}));
  }

  // Output sourcemaps in-memory to Vinyl file
  jsStream = jsStream.pipe(gulpSourcemaps.write('./'));

  // Return our stream
  return jsStream
    .pipe(gulp.dest('dist/js'))
    .pipe(gulpLivereload());
});

gulp.task('build', ['build-css', 'build-images', 'build-js']);

// Define our development tasks
gulp.task('livereload-update', function livereloadUpdate () {
  gulpLivereload.reload();
});

// DEV: `['build']` requires that our build task runs once
gulp.task('develop', ['build'], function develop () {
  // Set up our tasks to allow failures
  config.allowFailures = true;
  config.minifyAssets = false;

  // Start a livereload server
  gulpLivereload.listen();

  // Integrate watchify on browserify
  browserifyObj.plugin(watchify);
  browserifyObj.on('update', function handleBUpdate () {
    // DEV: At some point `gulp.run` will be deprecated, move to `gulp.series` when it does
    gulp.run('build-js');
  });
  // DEV: Trigger a browserify build to make watchify start watching files
  browserifyObj.bundle().on('data', function () {});

  // When one of our src files changes, re-run its corresponding task
  gulp.watch('browser/css/**/*.scss', ['build-css']);
  gulp.watch(['browser/images/**/*', '!browser/images/screenshots/**/*'],
    ['build-images']);
  gulp.watch('server/**/*', ['livereload-update']);
});
