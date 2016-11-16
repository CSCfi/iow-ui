/// <reference types="node" />

import * as path from 'path';
import * as webpack from 'webpack';
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
      { test: /\.ts$/,            loader: 'ng-annotate!ts-loader!strip-sourcemap-loader' },
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

const fastRebuild = true;

export function createConfig(build: boolean): Configuration {

  const outputPath = path.join(__dirname, 'public');
  const assetsPath = build ? path.join(outputPath, 'assets') : outputPath;

  const buildEnv = {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    GIT_DATE: JSON.stringify(process.env.GIT_DATE),
    GIT_HASH: JSON.stringify(process.env.GIT_HASH),
    FINTO_URL: JSON.stringify(process.env.FINTO_URL),
    API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT)
  };

  const serveEnv = {
    NODE_ENV: JSON.stringify('local')
  };

  const buildPlugins = [ new webpack.optimize.DedupePlugin(),  new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }) ];
  const servePlugins = [ new webpack.HotModuleReplacementPlugin() ];

  const plugins = [
    new webpack.DefinePlugin({ 'process.env': build ? buildEnv : serveEnv }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require(path.join(outputPath, 'vendor-manifest.json'))
    }),
    new HtmlWebpackPlugin({ template: 'src/index.html', filename: build ? '../index.html' : 'index.html' }),
    new AddAssetHtmlPlugin({
      filepath: require.resolve(path.join(outputPath, require(path.join(outputPath, 'assets.json')).vendor.js)),
      includeSourcemap: true
    }),
    new webpack.NoErrorsPlugin(),
    ...(build ? buildPlugins : servePlugins)
  ];

  return Object.assign({}, commonConfig, {
    entry: {
      init: './src/init.ts'
    },
    output: {
      path: assetsPath,
      filename: build ? '[name].[chunkhash].js' : '[name].js',
      publicPath: build ? '/assets/' : '/'
    },

    debug: !build,
    devtool: build ? 'source-map' : fastRebuild ? 'cheap-module-source-map' : 'source-map',
    plugins
  });
}

interface Configuration extends webpack.Configuration {
  tslint?: {
    configuration: {}
  };
}

declare module 'webpack' {
  interface DllReferencePluginStatic {
    new (options: any): Plugin;
  }

  interface Webpack {
    DllReferencePlugin: DllReferencePluginStatic;
  }
}
