/// <reference path="../typings/globals/node/index.d.ts" />
/// <reference path="../typings/globals/webpack/index.d.ts" />

declare module "webpack-merge" {

  import { Configuration } from 'webpack';

  interface WebpackMerge {
    (...configs: Configuration[]): Configuration;
  }

  export default WebpackMerge;
  export const smart: WebpackMerge;
}
