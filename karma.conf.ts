import * as karma from 'karma';
import * as webpack from 'webpack';
import { commonConfig } from './webpack.common-config';

const webpackTestConfig: webpack.Configuration = {
  module: commonConfig.module,
  resolve: commonConfig.resolve,
  devtool: 'inline-source-map',
};

interface Config extends karma.Config {
  set: (config: ConfigOptions) => void;
}

interface ConfigOptions extends karma.ConfigOptions {
  webpack?: webpack.Configuration;
  webpackServer?: any;
}

const files = ['spec-bundle.ts'];
const preprocessors: any = {};

for (const file of files) {
  preprocessors[file] = ['webpack', 'sourcemap'];
}

module.exports = function(config: Config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files,
    preprocessors,
    reporters: ['progress'],
    webpack: webpackTestConfig,
    webpackServer: { noInfo: true }, // no need for webpack output
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['PhantomJS'],
    autoWatch: false,
    singleRun: true
  });
};
