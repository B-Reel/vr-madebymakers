var watchify = require('watchify');
var browserify = require('browserify');
var stringify = require('stringify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var b = browserify('./app/app.js', {
    debug: true,
    cache: {},
    packageCache: {}
  })
  .transform(stringify(['.glsl']));

var w = watchify(b);

w.on('update', bundle);

function bundle(e) {
  if(e) {
    for(var i = 0; i < e.length; i++) {
      console.log('File changed', e[i]);
    }

    console.log(e.length, 'Files Built into /public/js/bundle.js');
    console.log('Watching for changes....');
  }

  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));
};

bundle();

console.log('Watching for changes....');
