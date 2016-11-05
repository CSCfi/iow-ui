/// <reference path="../node_modules/@types/protractor/index.d.ts" />
// TODO explicit type reference path should not be needed
// https://github.com/TypeStrong/ts-node/issues/168

const launcher: Launcher = require('../node_modules/protractor/built/launcher');

interface Launcher {
  init: (configFile: string|null, additionalConfig: any) => void;
}

// FIXME: If angular is imported properly then while initializing disableNgAnimate global window variable is missing
//        If just types are used by referencing angular.module etc... then compiler reports "Identifier 'angular' must be imported from a module"

declare const angular: any;

const config = {
  baseUrl: 'http://localhost:9001/',
  specs: ['e2e/tests/app.e2e.ts'],
  framework: 'jasmine2',
  allScriptsTimeout: 110000,
  jasmineNodeOpts: {
    showTiming: true,
    showColors: true,
    isVerbose: false,
    includeStackTrace: false,
    defaultTimeoutInterval: 400000
  },
  directConnect: true,
  capabilities: {
    'browserName': 'chrome'
  },

  onPrepare() {
    const disableNgAnimate = () => {
      angular.module('disableNgAnimate', []).run(['$animate', ($animate: any) => {
        $animate.enabled(false);
      }]);
    };

    browser.addMockModule('disableNgAnimate', disableNgAnimate);
  }
};

launcher.init(null, config);
