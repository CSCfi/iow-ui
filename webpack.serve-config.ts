import * as webpack from 'webpack';
import { commonConfig } from './webpack.common-config';
import { smart as smartMerge } from 'webpack-merge';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;

const fastRebuild = true;

const serveConfig: webpack.Configuration = {
  devtool: fastRebuild ? 'cheap-module-source-map' : 'source-map',
  debug: true,
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('local'),
      }
    }),
    new ForkCheckerPlugin()
  ],
  devServer: {
    host: '0.0.0.0',
    port: 9001,
    contentBase: './src',
    hot: true,
    inline: true,
    historyApiFallback: '/',
    proxy: {
      '/api/*': {
        target: 'http://localhost:8084/',
        secure: false
      }
    }
  }
};

export default smartMerge(commonConfig, serveConfig);
