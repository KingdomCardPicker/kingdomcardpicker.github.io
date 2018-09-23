const gulp = require('gulp');
const sass = require('gulp-sass');
const wait = require('gulp-wait');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const pump = require('pump');

gulp.task('serve', ['sass', 'scripts'], function () {
    browserSync.init({
        ghostMode: false,
        notify: false,
        server: {
            baseDir: ''
        }
    });

    gulp.watch("src/scss/**/*.scss", ['sass']);
    gulp.watch("src/scripts/**/*.js", ['scripts']);
    gulp.watch("app/scripts/**/*.js").on('change', browserSync.reload);
    gulp.watch("index.html").on('change', browserSync.reload);

    gulp.watch("gulpfile.js").on('change', process.exit);
});

gulp.task('serve-build', ['sass'], function () {
    browserSync.init({
        ghostMode: false,
        notify: false,
        server: {
            baseDir: 'app'
        }
    });
});

gulp.task('watch', ['sass'], function () {
    gulp.watch("src/**/*.scss", ['sass']);
});

gulp.task('sass', function () {
    return gulp.src("src/scss/main.scss")
        .pipe(wait(1000))
        .pipe(sass())
        .pipe(autoprefixer({ browsers: ['last 12 versions'] }))
        .pipe(gulp.dest("app/css/"))
        .pipe(browserSync.stream());
});

gulp.task('scripts', function () {
    return gulp.src(["src/scripts/**/*.js"])
        .pipe(uglify())
        .pipe(gulp.dest("app/scripts/"));
});

gulp.task('uglify-error-debugging', function (cb) {
    pump([
        gulp.src('src/scripts/**/*.js'),
        uglify()
    ], cb);
});

gulp.task('default', ['serve']);
