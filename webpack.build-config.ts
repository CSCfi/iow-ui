import * as webpack from 'webpack';
import { commonConfig, isVendorModule } from './webpack.common-config';
import { smart as smartMerge } from 'webpack-merge';
const AssetsPlugin = require('assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const buildConfig: webpack.Configuration = {
  output: {
    filename: 'app.[chunkhash].js',
    publicPath: '/assets/'
  },
  devtool: 'cheap-source-map',
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html', filename: '../index.html' }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.[chunkhash].js",
      minChunks: isVendorModule
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new AssetsPlugin({path: commonConfig.output.path})
  ]
};

export default smartMerge(commonConfig, buildConfig);
