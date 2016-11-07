/// <reference types="node" />

import * as path from 'path';
import * as webpack from 'webpack';

const HtmlWebpackPlugin = require('html-webpack-plugin');

interface Configuration extends webpack.Configuration {
  tslint: {
    configuration: {}
  };
}

export const commonConfig = {

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
  }
};

export const buildConfig = createConfig(true);
export const serveConfig = createConfig(false);

const fastRebuild = true;

function createConfig(build: boolean): Configuration {

  const plugins = [
    new HtmlWebpackPlugin({ template: 'src/index.html', filename: build ? '../index.html' : 'index.html' }),
    new webpack.NoErrorsPlugin()
  ];

  if (build) {
    plugins.push(new webpack.optimize.DedupePlugin());
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }));
    plugins.push(new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        GIT_DATE: JSON.stringify(process.env.GIT_DATE),
        GIT_HASH: JSON.stringify(process.env.GIT_HASH),
        FINTO_URL: JSON.stringify(process.env.FINTO_URL),
        API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT)
      }
    }));
  } else {
    plugins.push(new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('local'),
      }
    }));
    plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  return Object.assign({}, commonConfig, {
    entry: {
      init: './src/init.ts'
    },
    output: {
      path: path.join(__dirname, 'public/assets'),
      filename: build ? '[name].[chunkhash].js' : '[name].js',
      publicPath: build ? '/assets/' : '/'
    },

    debug: !build,
    devtool: build ? 'source-map' : fastRebuild ? 'cheap-module-source-map' : 'source-map',
    plugins,
    resolve: commonConfig.resolve,
    module: commonConfig.module,

    tslint: {
      configuration: require('./tslint.json')
    }
  });
}
