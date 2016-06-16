import * as webpack from 'webpack';
import { commonConfig, isVendorModule } from './webpack.common-config';
import { smart as smartMerge } from 'webpack-merge';
const HtmlWebpackPlugin = require('html-webpack-plugin');

const fastRebuild = true;

const serveConfig: webpack.Configuration = {
  devtool: fastRebuild ? 'cheap-module-source-map' : 'source-map',
  debug: true,
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
      minChunks: isVendorModule
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  devServer: {
    host: '0.0.0.0',
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
};

export default smartMerge(commonConfig, serveConfig);
