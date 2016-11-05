import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';
import { serveConfig } from '../webpack.config';
import { applyProgressBar } from './webpackProgressBar';

const compiler = applyProgressBar(webpack(serveConfig));
const server = new WebpackDevServer(compiler, {
  stats: { colors: true },
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
});

server.listen(9001, '0.0.0.0');
