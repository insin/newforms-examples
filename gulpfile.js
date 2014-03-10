var gulp = require('gulp')

var react = require('react-tools')
var through = require('through2')

var concat = require('gulp-concat')
var jshint = require('gulp-jshint')
var plumber = require('gulp-plumber')
var rename = require('gulp-rename')
var gutil = require('gulp-util')

var exampleJS = './!(node_modules|vendor)/*.js'
var exampleJSX = exampleJS + 'x'

// Inlined from gulp-react
function jsx(name) {
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('jsx', 'Streaming not supported'))
      return cb()
    }

    try {
      file.contents = new Buffer(react.transform(file.contents.toString()))
      file.path = gutil.replaceExtension(file.path, '.js')
    }
    catch (err) {
      err.fileName = file.path
      this.emit('error', new gutil.PluginError('gulp-react', err))
    }

    this.push(file)
    cb()
  })
}

gulp.task('jsx', function() {
  return gulp.src(exampleJSX)
    .pipe(plumber())
    .pipe(jsx())
    .on('error', function(e) {
      console.error(e.message + '\n  in ' + e.fileName)
    })
    .pipe(rename({ext: '.js'}))
    .pipe(gulp.dest('./'))
})

gulp.task('lint', function() {
  return gulp.src(exampleJS)
    .pipe(jshint('./.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
})

gulp.task('watch', function() {
  gulp.watch(exampleJSX, ['jsx'])
  gulp.watch(exampleJS, ['lint'])
})

gulp.task('default', ['watch', 'jsx'])
