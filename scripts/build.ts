import * as webpack from 'webpack';
import { buildConfig } from '../webpack.config';
import { applyProgressBar } from './webpackProgressBar';

const compiler = applyProgressBar(webpack(buildConfig));

compiler.run((err: Error, stats: webpack.compiler.Stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString({
    chunks: false,
    colors: true
  }));
});
