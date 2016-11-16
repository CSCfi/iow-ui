import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';
import { createConfig as createVendorConfig } from '../webpack.config-vendor';
import { createConfig as createAppConfig } from '../webpack.config';
import { applyProgressBar, report } from './webpackUtils';

const hostname = 'localhost';
const port = 9001;
const apiPort = 8084;

function applyHotLoading(config: webpack.Configuration) {

  function appendEntry(entry: any) {

    const result: any = {
      client: `webpack-dev-server/client?http://${hostname}:${port}/`
    };

    for (const [key, value] of Array.from(Object.entries(entry))) {
      result[key] = [value, 'webpack/hot/dev-server'];
    }

    return result;
  }

  return Object.assign({}, config, { entry: appendEntry(config.entry) });
}

applyProgressBar(webpack(createVendorConfig(false))).run((err: Error, stats: webpack.compiler.Stats) => {

  report(err, stats);

  const server = new WebpackDevServer(applyProgressBar(webpack(applyHotLoading(createAppConfig(false)))), {
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
});
