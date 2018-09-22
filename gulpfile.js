const gulp = require('gulp');
const sass = require('gulp-sass');
const wait = require('gulp-wait');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');

gulp.task('serve', ['sass'], function () {
    browserSync.init({
        ghostMode: false,
        notify: false,
        server: {
            baseDir: 'app'
        }
    });

    gulp.watch("src/scss/**/*.scss", ['sass']);
    gulp.watch("app/index.html").on('change', browserSync.reload);
    gulp.watch("app/scripts/**/*.js").on('change', browserSync.reload);

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

gulp.task('default', ['serve']);
