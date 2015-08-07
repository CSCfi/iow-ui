'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'ngMaterial',
  'myApp.main',
  'myApp.model',
  'myApp.version',
  'myApp.restapi',
  'pascalprecht.translate',
])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/main/main.html',
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

.controller('AppCtrl', ['$scope', '$location', function($scope, $location) {
 
  $scope.selectedIndex = 0;
    
            $scope.$watch('selectedIndex', function(current, old) {
              switch(current) {
                case 0: $location.url("/main"); break;
                case 1: $location.url("/model"); break;
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



