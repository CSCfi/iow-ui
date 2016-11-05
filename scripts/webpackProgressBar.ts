import * as webpack from 'webpack';
import * as chalk from 'chalk';
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

export function applyProgressBar(compiler: webpack.compiler.Compiler) {
  compiler.apply(new ProgressBarPlugin({
    format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
    clear: false
  }));

  return compiler;
}

declare module 'webpack' {
  namespace compiler {
    interface Compiler {
      apply(plugin: any): void;
    }
  }
}
