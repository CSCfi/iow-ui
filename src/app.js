const angular = require('angular');

require('angular-gettext');
require('./vendor/angular-xeditable-0.1.8/js/xeditable');

angular.module('iow-ui', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'xeditable',
  require('./components'),
  require('./services')
])
.config(function mainConfig($routeProvider) {
  $routeProvider
    .when('/', {
      template: require('./components/templates/index.html')
    })
    .when('/groups', {
      template: require('./components/templates/group.html'),
      controller: 'groupController',
      controllerAs: 'ctrl'
    })
    .when('/models', {
      template: require('./components/templates/model.html'),
      controller: 'modelController',
      controllerAs: 'ctrl'
    });
})
.run(function onAppRun($rootScope, editableOptions, languageService, userService) {
  editableOptions.theme = 'bs3';
  languageService.setLanguage('fi');
  userService.updateLogin().then(() => $rootScope.userInitialized = true);
  $rootScope.$on('gettextLanguageChanged', () => $rootScope.languageInitialized = true);
})
.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
