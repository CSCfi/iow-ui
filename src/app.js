const angular = require('angular');
require('angular-material');
require('angular-cookies');
require('angular-gettext');

require('./views/main/main');
require('./views/model/model');

require('./restapi/restapi');

angular.module('myApp', [
  require('angular-route'),
  'ngCookies',
  'ngMaterial',
  'myApp.main',
  'myApp.model',
  'myApp.restapi',
  'gettext'
])
.config(function mainConfig($routeProvider) {
  $routeProvider.when('/', {
    template: require('./views/main/main.html'),
    controller: 'MainCtrl'
  });
})

.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
