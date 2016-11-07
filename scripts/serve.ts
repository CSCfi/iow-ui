import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';
import { serveConfig } from '../webpack.config';
import { applyProgressBar } from './webpackProgressBar';

const hostname = 'localhost';
const port = 9001;
const apiPort = 8084;

function applyHotLoading(config: webpack.Configuration) {
  return Object.assign({}, config, {
    entry: Object.assign({}, config.entry, {
      dev: `webpack-dev-server/client?http://${hostname}:${port}/`,
      hot: 'webpack/hot/dev-server'
    })
  });
}

const compiler = applyProgressBar(webpack(applyHotLoading(serveConfig)));

const server = new WebpackDevServer(compiler, {
  stats: true,
  contentBase: './src',
  hot: true,
  historyApiFallback: '/',
  proxy: {
    '/api/*': {
      target: `http://${hostname}:${apiPort}/`,
      secure: false
    }
  }
});

server.listen(port, '0.0.0.0');
