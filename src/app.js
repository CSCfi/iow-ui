require('babel-polyfill');
const jQuery = require('jquery');
window.jQuery = jQuery;
require('jquery-mousewheel')(jQuery);
require('typeahead.js-browserify').loadjQueryPlugin();

const angular = require('angular');

require('angular-gettext');
require('checklist-model');

angular.module('iow-ui', [
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
.config(function mainConfig($routeProvider, $logProvider) {
  $logProvider.debugEnabled(false);

  $routeProvider
    .when('/', {
      template: require('./components/frontPage.html'),
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
