import * as webpack from 'webpack';

declare class WebpackDevServer {
  constructor(compiler: webpack.compiler.Compiler, options?: any);

  listen(port?: number, host?: string, callback?: () => void): void;
  close(): void;
}

declare namespace WebpackDevServer {}

export = WebpackDevServer;
