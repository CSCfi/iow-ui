const angular = require('angular');

require('angular-gettext');
require('./vendor/angular-xeditable-0.1.8/js/xeditable');

angular.module('myApp', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'xeditable',
  require('./directives'),
  require('./restapi'),
  require('./services'),
  require('./controllers')
])
.config(function mainConfig($routeProvider) {
  $routeProvider
    .when('/', {
      template: require('./views/index.html')
    })
    .when('/groups/:urn', {
      template: require('./views/group.html'),
      controller: 'groupController'
    })
    .when('/models/:urn', {
      template: require('./views/model.html'),
      controller: 'modelController'
    });
})
.run(function onAppRun($rootScope, editableOptions, languageService) {
  editableOptions.theme = 'bs3';
  languageService.setLanguage('fi');
  $rootScope.language = languageService.getLanguage();
})
.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
