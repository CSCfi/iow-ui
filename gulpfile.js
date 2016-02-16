var browserify = require('browserify');
var browserSync = require('browser-sync');
var duration = require('gulp-duration');
var gulp = require('gulp');
var gutil = require('gulp-util');
var notifier = require('node-notifier');
var path = require('path');
var prefix = require('gulp-autoprefixer');
var replace = require('gulp-replace');
var rev = require('gulp-rev');
var rimraf = require('rimraf');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var streamify = require('gulp-streamify');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var watchify = require('watchify');
var watch = require('gulp-watch');
var url = require('url');
var proxy = require('proxy-middleware');
var gettext = require('gulp-angular-gettext');
var buffer = require('vinyl-buffer');
var tsify = require('tsify');
var tsd = require('gulp-tsd');
var ngAnnotate = require('gulp-ng-annotate');
var _ = require('lodash');
var nodeResolve = require('resolve');
var gulpif = require('gulp-if');
var envify = require('envify/custom');

gulp.task('tsd', function (callback) {
  tsd({
    command: 'reinstall',
    config: './tsd.json'
  }, callback);
});

/* eslint "no-process-env":0 */
var production = process.env.NODE_ENV === 'production';

var config = {
  destination: './public',
  scripts: {
    source: './src/app.ts',
    destination: './public/js/',
    filename: 'app.js',
    vendorFilename: 'vendor.js'
  },
  templates: {
    source: './src/index.html',
    watch: './src/index.html',
    destination: './public/',
    revision: './public/**/*.html'
  },
  styles: {
    source: './src/app.scss',
    watch: ['./src/**/*.sass', './src/**/*.scss'],
    destination: './public/css/'
  },
  assets: {
    source: './src/assets/**/*.*',
    watch: './src/assets/**/*.*',
    destination: './public/'
  },
  revision: {
    source: ['./public/**/*.css', './public/**/*.js','./public/**/*.map'],
    base: path.join(__dirname, 'public'),
    destination: './public/'
  },
  translations: {
    source: './po/**/*.po',
    watch: './po/**/*.po',
    destination: './public/translations'
  }
};

var browserifyConfig = {
  entries: [config.scripts.source],
  extensions: config.scripts.extensions,
  debug: !production,
  cache: {},
  packageCache: {}
};

function handleError(err) {
  if (err.name === 'TypeScript error') {
    gutil.log(err.message);
  } else {
    gutil.log(err);
  }
  gutil.beep();
  notifier.notify({
    title: 'Compile Error',
    message: err.message
  });
  return this.emit('end');
}

gulp.task('build-vendor', function () {

  var b = browserify({
    // generate source maps in non-production environment
    debug: !production
  });

  getNPMPackageIds().forEach(function (id) {
    b.require(nodeResolve.sync(id), { expose: id });
  });

  return b.bundle()
    .on('error', handleError)
    .pipe(source(config.scripts.vendorFilename))
    .pipe(gulpif(production, streamify(uglify())))
    .pipe(gulp.dest(config.scripts.destination));
});


function compileAppJs(watch) {
  var pipeline = browserify(browserifyConfig);

  if (watch) {
    pipeline = watchify(pipeline);
    pipeline.on('update', rebundle);
  }

  getNPMPackageIds().forEach(function (id) {
    pipeline.external(id);
  });

  pipeline.plugin('tsify', { 'typescript': require('typescript')});

  pipeline.transform(envify({
    NODE_ENV: process.env.NODE_ENV || 'development',
    GIT_DATE: process.env.GIT_DATE,
    GIT_HASH: process.env.GIT_HASH,
    FINTO_URL: process.env.FINTO_URL
  }));

  function rebundle() {
    var b = pipeline.bundle()
      .on('error', handleError)
      .pipe(source(config.scripts.filename))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(ngAnnotate())
      .pipe(gulpif(production, streamify(uglify())))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.scripts.destination));

    if (watch) {
      b.pipe(duration('Rebundling browserify bundle'))
        .pipe(browserSync.reload({stream: true}));
    }
  }

  return rebundle();
}

gulp.task('build-app', function () {
  return compileAppJs(false);
});

gulp.task('scripts', ['tsd', 'build-vendor', 'build-app']);

gulp.task('templates', function() {
  var pipeline = gulp.src(config.templates.source)
  .on('error', handleError)
  .pipe(gulp.dest(config.templates.destination));

  if (production) {
    return pipeline;
  }

  return pipeline.pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('styles', function() {
  var pipeline = gulp.src(config.styles.source);
  var sassOpts = production ? {outputStyle: 'compressed'} : {};

  if (!production) {
    pipeline = pipeline.pipe(sourcemaps.init());
  }

  pipeline = pipeline.pipe(sass(sassOpts).on('error', sass.logError))
  .on('error', handleError)
  .pipe(prefix('last 2 versions', 'Chrome 34', 'Firefox 28', 'iOS 7'));

  if (!production) {
    pipeline = pipeline.pipe(sourcemaps.write('.'));
  }

  pipeline = pipeline.pipe(gulp.dest(config.styles.destination));

  if (production) {
    return pipeline;
  }

  return pipeline.pipe(browserSync.stream({
    match: '**/*.css'
  }));
});

gulp.task('assets', function() {
  return gulp.src(config.assets.source)
    .pipe(gulp.dest(config.assets.destination));
});

gulp.task('fonts', function() {
  return gulp.src('./node_modules/bootstrap-sass/assets/fonts/bootstrap/*')
    .pipe(gulp.dest('./public/fonts/bootstrap'));
});

gulp.task('server', function() {
  var proxyOptions = url.parse('http://localhost:8084/api');
  proxyOptions.route = '/api';
  return browserSync({
    open: false,
    port: 9001,
    notify: false,
    ghostMode: false,
    server: {
      baseDir: config.destination,
      middleware: [proxy(proxyOptions)]
    }
  });
});

gulp.task('watch', ['tsd', 'build-vendor'], function() {

  ['templates', 'styles', 'assets', 'translations'].forEach(function(watched) {
    watch(config[watched].watch, function() {
      gulp.start(watched);
    });
  });

  return compileAppJs(true);
});

gulp.task('pot', function () {
    return gulp.src(['src/**/*.html', 'src/**/*.ts'])
        .pipe(gettext.extract('template.pot'))
        .pipe(gulp.dest('po/'));
});

gulp.task('translations', function () {
    return gulp.src(config.translations.source)
        .pipe(gettext.compile({
            format: 'json'
        }))
        .pipe(gulp.dest(config.translations.destination));
});

var buildTasks = ['templates', 'styles', 'assets', 'fonts', 'translations'];

gulp.task('revision', buildTasks.concat(['scripts']), function() {
  return gulp.src(config.revision.source, {base: config.revision.base})
    .pipe(rev())
    .pipe(gulp.dest(config.revision.destination))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./'));
});

gulp.task('replace-revision-references', ['revision', 'templates'], function() {
  var revisions = require('./rev-manifest.json');

  var pipeline = gulp.src(config.templates.revision);

  pipeline = Object.keys(revisions).reduce(function(stream, key) {
    return stream.pipe(replace(key, revisions[key]));
  }, pipeline);

  return pipeline.pipe(gulp.dest(config.templates.destination));
});

gulp.task('build', function() {
  rimraf.sync(config.destination);
  gulp.start(buildTasks.concat(['scripts', 'revision', 'replace-revision-references']));
});

gulp.task('default', buildTasks.concat(['watch', 'server']));


function getNPMPackageIds() {
  // read package.json and get dependencies' package ids
  var packageManifest = {};
  try {
    packageManifest = require('./package.json');
  } catch (e) {
    // does not have a package.json manifest
  }
  return _.keys(packageManifest.dependencies) || [];
}
