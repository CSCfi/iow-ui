const angular = require('angular');

require('angular-cookies');
require('angular-gettext');

require('./restapi/restapi');

angular.module('myApp', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'ngCookies',
  'gettext'
])
.config(function mainConfig($routeProvider) {
})

.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
