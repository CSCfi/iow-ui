require('babel-polyfill');
window.jQuery = require('jquery');
require('typeahead.js-browserify').loadjQueryPlugin();

const angular = require('angular');

require('angular-gettext');

angular.module('iow-ui', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  require('./components/common'),
  require('./components/form'),
  require('./components/group'),
  require('./components/model'),
  require('./components/navigation'),
  require('./components'),
  require('./services')
])
.config(function mainConfig($routeProvider, $logProvider) {

  $logProvider.debugEnabled(false);

  $routeProvider
    .when('/', {
      template: require('./components/index.html'),
      controller: 'frontPageController',
      controllerAs: 'ctrl'
    })
    .when('/groups', {
      template: require('./components/group/group.html'),
      controller: 'groupController',
      controllerAs: 'ctrl',
      resolve: {
        groupId($route) {
          return $route.current.params.urn;
        }
      }
    })
    .when('/models', {
      template: require('./components/model/model.html'),
      controller: 'modelController',
      controllerAs: 'ctrl',
      reloadOnSearch: false
    });
})
.run(function onAppRun($rootScope, $q, languageService, userService, gettextCatalog) {
  userService.updateLogin().then(() => $rootScope.applicationInitialized = true);
  gettextCatalog.debug = true;
})
.controller('AppCtrl', function mainAppCtrl($scope) {

});
