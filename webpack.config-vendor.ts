/// <reference types="node" />

import * as path from 'path';
import * as webpack from 'webpack';
const AssetsPlugin = require('assets-webpack-plugin');

const skippedDependencies = ['font-awesome'];

export function createConfig(build: boolean): webpack.Configuration {

  const outputPath = path.join(__dirname, 'public');
  const assetsPath = build ? path.join(outputPath, 'assets') : outputPath;

  const buildPlugins = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ];

  const servePlugins = [];

  return {
    entry: {
      'vendor': Array.from(Object.keys(require('./package.json').dependencies)).filter(dep => skippedDependencies.indexOf(dep) === -1)
    },
    output: {
      path: assetsPath,
      filename: build ? '[name].[hash].js' : '[name].js',
      publicPath: build ? '/assets/' : '/',
      library: '[name]_lib'
    },
    plugins: [
      new AssetsPlugin({ path: outputPath, filename: 'assets.json' }),
      new webpack.DllPlugin({
        path: outputPath + '/' + '[name]-manifest.json',
        name: '[name]_lib'
      }),
      ...(build ? buildPlugins : servePlugins)
    ],
    resolve: {
      alias: {
        'proxy-polyfill': path.resolve(__dirname, 'node_modules/proxy-polyfill/proxy.min.js')
      }
    },
    debug: !build,
    devtool: build ? 'source-map' : 'cheap-module-source-map',
  };
}

declare module 'webpack' {
  interface DllPluginStatic {
    new (options: any): Plugin;
  }

  interface Webpack {
    DllPlugin: DllPluginStatic;
  }
}
