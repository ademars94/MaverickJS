var gulp   = require('gulp'),
    gutil  = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');

uglifyScripts = function() {
  gulp.src('./public/javascripts/app.js')
    .pipe(uglify())
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./public/javascripts'))
};

gulp.task('default', function() {
  uglifyScripts();
});