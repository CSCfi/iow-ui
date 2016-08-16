/// <reference path="./type-context/protractor.d.ts" />

exports.config = {
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
    var disableNgAnimate = function () {
      angular.module('disableNgAnimate', []).run(['$animate', function ($animate: angular.animate.IAnimateService) {
        $animate.enabled(false);
      }]);
    };

    browser.addMockModule('disableNgAnimate', disableNgAnimate);
  }
};
