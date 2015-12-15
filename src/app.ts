/// <reference path="./main.d.ts" />

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
import { UserService } from './services/userService';
import { LanguageService } from './services/languageService';
import { FrontPageController } from './components/frontPageController';
import { ModelController } from './components/model/modelController';
import { GroupController } from './components/group/groupController';
import { config } from './config';

import * as jQuery from 'jquery';
window.jQuery = jQuery;
import * as angular from 'angular';

require('jquery-mousewheel')(jQuery);
require("typeahead.js");
require('angular-gettext');
require('checklist-model');

angular.module('iow-ui', [
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
  require('./components'),
  require('./services')
])
.config(function mainConfig($routeProvider: IRouteProvider, $logProvider: ILogProvider) {
  $logProvider.debugEnabled(false);

  $routeProvider
    .when('/', {
      template: require('./components/frontPage.html'),
      controller: FrontPageController,
      controllerAs: 'ctrl'
    })
    .when('/groups', {
      template: require('./components/group/group.html'),
      controller: GroupController,
      controllerAs: 'ctrl',
      resolve: {
        groupId($route: IRouteService) {
          return $route.current.params.urn;
        }
      }
    })
    .when('/models', {
      template: require('./components/model/model.html'),
      controller: ModelController,
      controllerAs: 'ctrl',
      reloadOnSearch: false
    });
})
.run(function onAppRun($rootScope: RootScope, $location: ILocationService, languageService: LanguageService, userService: UserService, gettextCatalog: gettextCatalog) {
  userService.updateLogin().then(() => $rootScope.applicationInitialized = true);
  $rootScope.showFooter = () => $location.path() === '/';
  gettextCatalog.debug = true;
  $rootScope.production = config.production;
})
.controller('AppCtrl', function mainAppCtrl() {

})
.directive('googleAnalytics', () => {
  return {
    restrict: 'E',
    template: require('./googleAnalytics.html')
  }
});

interface RootScope extends IRootScopeService {
  applicationInitialized: boolean;
  showFooter: () => boolean;
  production: boolean;
}
