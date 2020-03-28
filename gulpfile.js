const gulp = require("gulp");
const sass = require("gulp-sass");
const wait = require("gulp-wait");
const browserSync = require("browser-sync").create();
const babel = require("gulp-babel");
const autoprefixer = require("gulp-autoprefixer");
const uglify = require("gulp-uglify-es").default;
const pump = require("pump");
const fs = require("fs");
const fsrec = require("recursive-readdir");

sass.compiler = require("node-sass");

gulp.task("serve", () => {
    return new Promise(((resolve, reject) => {
        gulp.series(["resources", "sass", "scripts"]);

        browserSync.init({
            ghostMode: false,
            notify: false,
            server: {
                baseDir: "",
            },
        });

        gulp.watch("src/scss/**/*.scss", ["sass"]);
        gulp.watch("src/scripts/**/*.js", ["scripts"]);
        gulp.watch("app/scripts/**/*.js").on("change", browserSync.reload);
        gulp.watch("index.html").on("change", browserSync.reload);

        gulp.watch("gulpfile.js").on("change", process.exit);
        resolve();
    }));
});

gulp.task("build", () => {
    return new Promise(((resolve, reject) => {
        gulp.series(["resources", "sass", "scripts"]);
        resolve();
    }));
});

gulp.task("serve-build", () => {
    gulp.series("sass");
    return browserSync.init({
        ghostMode: false,
        notify: false,
        server: {
            baseDir: "",
        },
    });
});

gulp.task("watch", () => {
    gulp.series("sass");
    return gulp.watch("src/**/*.scss", gulp.series("sass"));
});

gulp.task("sass", () => {
    return gulp.src("src/scss/main.scss")
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(gulp.dest("app/css/"))
        .pipe(browserSync.stream());
});

gulp.task("scripts", () => {
    return gulp.src(["src/scripts/**/*.js"])
        .pipe(babel({ presets: ["@babel/env"] }))
        .pipe(uglify())
        .pipe(gulp.dest("app/scripts/"));
});

gulp.task("resources", () => {
    return new Promise(((resolve, reject) => {
        fsrec("app", (err, files) => {
            if (err) {
                reject(err);
            }

            const resources = [];
            const cardResources = [];
            files.forEach((file) => {
                const fileName = file.split("\\").join("/");
                if (!fileName.startsWith("app/img")) {
                    resources.push(`"${fileName}"`);
                } else {
                    cardResources.push(`"${fileName}"`);
                }
            });

            const resourcesJs = `var kingdomResources = [${resources.join(",")}];`;
            fs.writeFileSync("app/resources.js", resourcesJs);
            const cardResourcesJs = `var kingdomResourcesCardImages = [${cardResources.join(",")}];`;
            fs.writeFileSync("app/resources-cards.js", cardResourcesJs);

            resolve();
        });
    }));
});

gulp.task("uglify-error-debugging", (cb) => {
    pump([
        gulp.src("src/scripts/**/*.js"),
        uglify(),
    ], cb);
});
