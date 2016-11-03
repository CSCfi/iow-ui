import * as webpack from 'webpack';
import { commonConfig } from './webpack.common-config';
import { smart as smartMerge } from 'webpack-merge';
const AssetsPlugin = require('assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// TODO: Figure out how to split vendor dependencies into own chunk with require.ensure code folding used in init.ts

const buildConfig: webpack.Configuration = {
  output: {
    filename: '[name].[chunkhash].js',
    publicPath: '/assets/'
  },
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html', filename: '../index.html' }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new AssetsPlugin({path: commonConfig.output!.path}),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        GIT_DATE: JSON.stringify(process.env.GIT_DATE),
        GIT_HASH: JSON.stringify(process.env.GIT_HASH),
        FINTO_URL: JSON.stringify(process.env.FINTO_URL),
        API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT)
      }
    })
  ]
};

export default smartMerge(commonConfig, buildConfig);
