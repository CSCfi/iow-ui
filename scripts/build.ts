import * as webpack from 'webpack';
import { createConfig as createVendorConfig } from '../webpack.config-vendor';
import { createConfig as createAppConfig } from '../webpack.config';
import { applyProgressBar, report } from './webpackUtils';

applyProgressBar(webpack(createVendorConfig(true))).run((err: Error, stats: webpack.compiler.Stats) => {
  report(err, stats);
  applyProgressBar(webpack(createAppConfig(true))).run(report);
});
