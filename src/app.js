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
    .when('/groups/:groupId', {
      template: require('./views/group.html'),
      controller: 'groupController'
    });
})
.run(function onAppRun(editableOptions) {
  editableOptions.theme = 'bs3';
})
.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
