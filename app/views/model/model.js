'use strict';

angular.module('myApp.model', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/model', {
    templateUrl: 'views/model/model.html',
    controller: 'ModelCtrl'
  });
  
  
}])

.controller('ModelCtrl', ['$scope', '$location','RestAPI', function($scope, $location, RestAPI) {
  
  $scope.models;
  $scope.graphs;
  
    RestAPI.getModels().then(function(response){
        var data = response.data;
        $scope.models = data;
        $scope.graphs = data["@graph"];
    });

}]);