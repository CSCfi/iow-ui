"use strict";
var webpack = require('webpack');
var WebpackConfig = require('webpack-config');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var fastRebuild = false;

module.exports = new WebpackConfig().extend('./webpack.common-config.js').merge({
  devtool: fastRebuild ? 'cheap-module-eval-source-map' : 'source-map',
  debug: true,
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js", isVendorModule),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  devServer: {
    port: 9001,
    contentBase: './src',
    hot: true,
    inline: true,
    proxy: {
      '/api/*': {
        target: 'http://localhost:8084/',
        secure: false
      }
    }
  }
});

// TODO: copy-paste from build-config
var appDir = path.join(__dirname, 'src');

function isVendorModule(module) {
  return module.resource && module.resource.indexOf(appDir) === -1;
}
