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
import * as _ from 'lodash';
import { UserService } from './services/userService';
import { LanguageService } from './services/languageService';
import { FrontPageController } from './components/frontPageController';
import { UserController } from './components/user/userController';
import { ModelController } from './components/model/modelController';
import { GroupController } from './components/group/groupController';
import { Language } from './services/languageService';
import { User } from './services/entities';
import { LoginModal } from './components/navigation/loginModal';
import { config } from './config';

import * as jQuery from 'jquery';
window.jQuery = jQuery;
import * as angular from 'angular';

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

mod.config(function mainConfig($routeProvider: IRouteProvider, $logProvider: ILogProvider, $compileProvider: ICompileProvider) {
  $logProvider.debugEnabled(false);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|https?|mailto):/);

  $routeProvider
    .when('/', {
      template: require('./components/frontPage.html'),
      controller: FrontPageController,
      controllerAs: 'ctrl'
    })
    .when('/user', {
      template: require('./components/user/user.html'),
      controller: UserController,
      controllerAs: 'ctrl',
    })
    .when('/group', {
      template: require('./components/group/group.html'),
      controller: GroupController,
      controllerAs: 'ctrl',
      resolve: {
        groupId($route: IRouteService) {
          return $route.current.params.urn;
        }
      }
    })
    .when('/model', {
      template: require('./components/model/model.html'),
      controller: ModelController,
      controllerAs: 'ctrl',
      reloadOnSearch: false
    });
});

interface RootScope extends IRootScopeService {
  applicationInitialized: boolean;
  showFooter: () => boolean;
  production: boolean;
}

mod.run(function onAppRun($rootScope: RootScope, $location: ILocationService, languageService: LanguageService, userService: UserService, gettextCatalog: gettextCatalog) {
  userService.updateLogin().then(() => $rootScope.applicationInitialized = true);
  $rootScope.showFooter = () => $location.path() === '/';
  gettextCatalog.debug = true;
  $rootScope.production = config.production;
});

mod.directive('googleAnalytics', () => {
  return {
    restrict: 'E',
    template: require('./googleAnalytics.html')
  }
});

class ApplicationController {

  languages: {code: Language, name: string}[];

  /* @ngInject */
  constructor(private languageService: LanguageService, private userService: UserService, private loginModal: LoginModal) {
    this.languages = _.map(languageService.availableLanguages, language => {
      switch (language) {
        case 'fi':
          return {code: language, name: 'Suomeksi'};
        case 'en':
          return {code: language, name: 'In English'};
        default:
          throw new Error('Uknown language: ' + language);
      }
    });
  }

  get language(): Language {
    return this.languageService.UILanguage;
  }

  set language(language: Language) {
    this.languageService.UILanguage = language;
    this.languageService.modelLanguage = language;
  }

  getUser(): User {
    return this.userService.user;
  }

  logout() {
    return this.userService.logout();
  }

  openLogin() {
    this.loginModal.open();
  }
}

mod.controller('AppCtrl', ApplicationController);

