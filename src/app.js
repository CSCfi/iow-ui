const angular = require('angular');
require('angular-material');
require('angular-cookies');
require('angular-gettext');

require('./views/main/main');
require('./views/model/model');

require('./components/restapi/restapi');
require('./components/version/version');

// Declare app level module which depends on views, and components
angular.module('myApp', [
  require('angular-route'),
  'ngCookies',
  'ngMaterial',
  'myApp.main',
  'myApp.model',
  'myApp.version',
  'myApp.restapi',
  'gettext'
])

.config(['$routeProvider', function mainConfig($routeProvider) {
  $routeProvider.when('/', {
    template: require('./views/main/main.html'),
    controller: 'MainCtrl'
  });
}])

/*
.config(['$httpProvider', function($httpProvider) {
 $httpProvider.defaults.withCredentials = true;
}])
*/

/*
.run(['$http', '$cookies', function($http, $cookies) {
        //X-CSRFToken
  $http.defaults.headers.post['X-Requested-By'] = $cookies.csrftoken;
}])*/

.controller('AppCtrl', ['$scope', '$location', function mainAppCtrl($scope, $location) {
  $scope.selectedIndex = 0;

  $scope.$watch('selectedIndex', function watchSelectedIndex(current, old) {
    if (current === 0) {
      $location.url('/main');
    } else if (current === 1) {
      $location.url('/model');
    }
  });
}]);


/* Tuotantovaiheessa NGINX ohjaus? */
/*
.config(['$locationProvider', function($locationProvider)
{
    $locationProvider.html5Mode(true);
}]);
*/
