angular.module('myApp.main', ['ngRoute'])

.config(function mainConfig($routeProvider) {
  $routeProvider.when('/main', {
    template: require('./main.html'),
    controller: 'MainCtrl'
  });
})
.controller('MainCtrl', function mainController($scope, $location, RestAPI) {

});
