const angular = require('angular');

require('angular-material');
require('angular-cookies');
require('angular-gettext');

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
})

.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
