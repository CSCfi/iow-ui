/// <reference types="node" />

import * as path from 'path';
import * as webpack from 'webpack';

interface Configuration extends webpack.Configuration {
  tslint: {
    configuration: {}
  };
}

export const commonConfig: Configuration = {
  entry: './src/init.ts',
  output: {
    path: path.join(__dirname, 'public/assets'),
    filename: 'app.js'
  },

  resolve: {
    extensions: ['', '.ts', '.js'],
    alias: {
      'proxy-polyfill': path.resolve(__dirname, 'node_modules/proxy-polyfill/proxy.min.js')
    }
  },

  module: {
    preLoaders: [
      { test: /\.ts$/,            loader: 'tslint' }
    ],
    loaders: [
      { test: /\.js$/,            loader: 'strip-sourcemap-loader' },
      { test: /\.css$/,           loader: 'style!css' },
      { test: /\.scss$/,          loader: 'style!css!sass' },
      { test: /\.ts$/,            loader: 'ng-annotate!awesome-typescript-loader!strip-sourcemap-loader' },
      { test: /\.woff(\?.+)?$/,   loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.woff2(\?.+)?$/,  loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.ttf(\?.+)?$/,    loader: 'file-loader' },
      { test: /\.eot(\?.+)?$/,    loader: 'file-loader' },
      { test: /\.svg(\?.+)?$/,    loader: 'file-loader' },
      { test: /\.html/,           loader: 'raw' },
      { test: /\.po$/,            loader: 'json!po?format=mf' },
      { test: /\.png$/,           loader: 'url-loader?mimetype=image/png' },
      { test: /\.gif$/,           loader: 'url-loader?mimetype=image/gif' }
    ]
  },

  tslint: {
    configuration: require('./tslint.json')
  }
};

const appDir = path.join(__dirname, 'src');

export function isVendorModule(module: { resource: string }) {
  return module.resource && module.resource.indexOf(appDir) === -1;
}
