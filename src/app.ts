/// <reference path="./main.d.ts" />

import ICompileProvider = angular.ICompileProvider;
import ILocationService = angular.ILocationService;
import ILogProvider = angular.ILogProvider;
import IProvideService = angular.auto.IProvideService;
import IRootScopeService = angular.IRootScopeService;
import IRoute = angular.route.IRoute;
import IRouteProvider = angular.route.IRouteProvider;
import IRouteService = angular.route.IRouteService;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import 'core-js';
import { routeConfig } from './routes';

import * as jQuery from 'jquery';
window.jQuery = jQuery;
import * as angular from 'angular';

require('./vendor/modernizr');
require('jquery-mousewheel')(jQuery);
require("typeahead.js");
require('angular-gettext');
require('checklist-model');

const mod = angular.module('iow-ui', [
  require('angular-messages'),
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'checklist-model',
  require('./components/common'),
  require('./components/editor'),
  require('./components/form'),
  require('./components/group'),
  require('./components/model'),
  require('./components/navigation'),
  require('./components/user'),
  require('./components'),
  require('./services')
]);

mod.config(routeConfig);

mod.config(function mainConfig($routeProvider: IRouteProvider, $logProvider: ILogProvider, $compileProvider: ICompileProvider) {
  $logProvider.debugEnabled(false);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|https?|mailto):/);
});

mod.run(function onAppRun(gettextCatalog: gettextCatalog) {
  gettextCatalog.debug = true;
});

angular.bootstrap(document.body, ['iow-ui'], {strictDi: true});
