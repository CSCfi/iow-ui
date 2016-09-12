import { ICompileProvider, ILogProvider, ILocationProvider, route, ui, auto, animate } from 'angular';
import IRoute = route.IRoute;
import IProvideService = auto.IProvideService;
import IRouteService = route.IRouteService;
import IAnimateProvider = animate.IAnimateProvider;
import ITooltipProvider = ui.bootstrap.ITooltipProvider;
import './shim';
import * as jQuery from 'jquery';
window.jQuery = jQuery;
import * as angular from 'angular';
import { routeConfig } from './routes';
import commonModule from './components/common';
import editorModule from './components/editor';
import formModule from './components/form';
import groupModule from './components/group';
import modelModule from './components/model';
import navigationModule from './components/navigation';
import userModule from './components/user';
import componentsModule from './components';
import servicesModule from './services';

import './styles/app.scss';
import 'font-awesome/scss/font-awesome.scss';

require('./vendor/modernizr');
require('imports?define=>false!jquery-mousewheel/jquery.mousewheel')(jQuery);
require('angular-gettext');
require('checklist-model');

const mod = angular.module('iow-ui', [
  require('angular-animate'),
  require('angular-messages'),
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'checklist-model',
  commonModule,
  editorModule,
  formModule,
  groupModule,
  modelModule,
  navigationModule,
  userModule,
  componentsModule,
  servicesModule
]);

mod.config(routeConfig);

mod.config(($locationProvider: ILocationProvider,
            $logProvider: ILogProvider,
            $compileProvider: ICompileProvider,
            $animateProvider: IAnimateProvider,
            $uibTooltipProvider: ITooltipProvider) => {

  $locationProvider.html5Mode(true);
  $logProvider.debugEnabled(false);

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|https?|mailto):/);

  // disable angular-animate framework when 'ng-animate-disabled' class is added to animated element
  $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);

  $uibTooltipProvider.options({ appendToBody: true });
  $uibTooltipProvider.setTriggers({'mouseenter': 'mouseleave click'});
});

// FIXME: proper typing for gettextCatalog
mod.run((gettextCatalog: any) => gettextCatalog.debug = true);

export const done = new Promise((resolve) => {
  mod.run(() => resolve(true));
});

angular.bootstrap(document.body, ['iow-ui'], {strictDi: true});

