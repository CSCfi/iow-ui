import * as karma from 'karma';
import * as webpack from 'webpack';
import { commonConfig } from '../webpack.config';

const webpackTestConfig: webpack.Configuration = Object.assign({}, commonConfig, {
  devtool: 'inline-source-map'
});

interface ConfigOptions extends karma.ConfigOptions {
  webpack?: webpack.Configuration;
  webpackServer?: any;
}

const files = ['spec-bundle.ts'];
const preprocessors: any = {};

for (const file of files) {
  preprocessors[file] = ['webpack', 'sourcemap'];
}

const config: ConfigOptions = {
  basePath: '',
  frameworks: ['jasmine'],
  files,
  preprocessors,
  reporters: ['progress'],
  webpack: webpackTestConfig,
  webpackServer: { noInfo: true }, // no need for webpack output
  port: 9876,
  colors: true,
  browsers: ['PhantomJS'],
  autoWatch: false,
  singleRun: true
};

new karma.Server(config, process.exit).start();
