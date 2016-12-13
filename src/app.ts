import { ICompileProvider, ILogProvider, ILocationProvider, ui, animate } from 'angular';
import IAnimateProvider = animate.IAnimateProvider;
import ITooltipProvider = ui.bootstrap.ITooltipProvider;
import './shim';
import * as jQuery from 'jquery';
window.jQuery = jQuery;
import * as angular from 'angular';
import { routeConfig } from './routes';
import { module as commonModule } from './components/common';
import { module as editorModule } from './components/editor';
import { module as visualizationModule } from './components/visualization';
import { module as formModule } from './components/form';
import { module as groupModule } from './components/group';
import { module as modelModule } from './components/model';
import { module as navigationModule } from './components/navigation';
import { module as userModule } from './components/user';
import { module as filterModule } from './components/filter';
import { module as componentsModule } from './components';
import { module as servicesModule } from './services';
import { module as helpModule } from './help';

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
  commonModule.name,
  editorModule.name,
  visualizationModule.name,
  formModule.name,
  groupModule.name,
  modelModule.name,
  navigationModule.name,
  userModule.name,
  filterModule.name,
  componentsModule.name,
  servicesModule.name,
  helpModule.name
]);

mod.config(routeConfig);

mod.config(($locationProvider: ILocationProvider,
            $logProvider: ILogProvider,
            $compileProvider: Angular16ICompileProvider,
            $animateProvider: IAnimateProvider,
            $uibTooltipProvider: ITooltipProvider) => {

  $locationProvider.html5Mode(true);
  $logProvider.debugEnabled(false);

  // Breaking change in angular 1.5 -> 1.6 consider adopting the $onInit style which is now default
  $compileProvider.preAssignBindingsEnabled(true);
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

// TODO replace with angular 1.6 @types when available
interface Angular16ICompileProvider extends ICompileProvider {
  preAssignBindingsEnabled(value: boolean): void;
}
