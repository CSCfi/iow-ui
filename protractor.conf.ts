/// <reference types="jasmine" />
/// <reference types="protractor" />

// FIXME: If angular is imported properly then while initializing disableNgAnimate global window variable is missing
//        If just types are used by referencing angular.module etc... then compiler reports "Identifier 'angular' must be imported from a module"

declare const angular: any;

export const config = {
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
