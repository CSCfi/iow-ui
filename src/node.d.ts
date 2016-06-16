/// <reference path="../typings/globals/angular-protractor/index.d.ts" />
/// <reference path="../typings/globals/jasmine/index.d.ts" />
/// <reference path="../typings/globals/selenium-webdriver/index.d.ts" />
/// <reference path="../typings/globals/source-map/index.d.ts" />
/// <reference path="../typings/globals/uglify-js/index.d.ts" />
/// <reference path="../typings/globals/webpack/index.d.ts" />
/// <reference path="../typings/globals/node/index.d.ts" />

declare module "webpack-merge" {

  import { Configuration } from 'webpack';

  interface WebpackMerge {
    (...configs: Configuration[]): Configuration;
  }

  export default WebpackMerge;
  export const smart: WebpackMerge;
}
