angular.module('myApp.main', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/main', {
    template: require('./main.html'),
    controller: 'MainCtrl'
  });
}])

.controller('MainCtrl', ['$scope', '$location', 'RestAPI', function($scope, $location, RestAPI) {
}]);
