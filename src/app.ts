import { ICompileProvider, ILogProvider, ILocationProvider, ui, animate } from 'angular';
import IAnimateProvider = animate.IAnimateProvider;
import ITooltipProvider = ui.bootstrap.ITooltipProvider;
import './shim';
import * as jQuery from 'jquery';
window.jQuery = jQuery;
import * as angular from 'angular';
import { routeConfig } from './routes';
import commonModule from './components/common';
import editorModule from './components/editor';
import visualizationModule from './components/visualization';
import formModule from './components/form';
import groupModule from './components/group';
import modelModule from './components/model';
import navigationModule from './components/navigation';
import userModule from './components/user';
import filterModule from './components/filter';
import componentsModule from './components';
import servicesModule from './services';
import helpModule from './help';

import './styles/app.scss';
import 'font-awesome/scss/font-awesome.scss';

require('./vendor/modernizr');
require('imports?define=>false!jquery-mousewheel/jquery.mousewheel')(jQuery);
require('angular-gettext');
require('checklist-model');
require('ngclipboard');

const mod = angular.module('iow-ui', [
  require('angular-animate'),
  require('angular-messages'),
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'checklist-model',
  'ngclipboard',
  commonModule,
  editorModule,
  visualizationModule,
  formModule,
  groupModule,
  modelModule,
  navigationModule,
  userModule,
  filterModule,
  componentsModule,
  servicesModule,
  helpModule
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

  // enable angular-animate framework when 'ng-animate-enabled' class is added to animated element
  $animateProvider.classNameFilter(/ng-animate-enabled/);

  $uibTooltipProvider.options({ appendToBody: true });
  $uibTooltipProvider.setTriggers({'mouseenter': 'mouseleave click'});
});

// FIXME: proper typing for gettextCatalog
mod.run((gettextCatalog: any) => gettextCatalog.debug = true);

export const done = new Promise((resolve) => {
  mod.run(() => resolve(true));
});

angular.bootstrap(document.body, ['iow-ui'], {strictDi: true});

