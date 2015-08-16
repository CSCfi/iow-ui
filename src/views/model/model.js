'use strict';

angular.module('myApp.model', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/model', {
    templateUrl: 'views/model/model.html',
    controller: 'ModelCtrl'
  });
  
  
}])

.controller('ModelCtrl', ['$scope', '$location','RestAPI', function($scope, $location, RestAPI) {
  
  $scope.data;
  $scope.graph;
  $scope.model;
  
    RestAPI.getAvailableModels().then(function(response){
 
       $scope.data = response;
       
       $scope.graph = $scope.data["@graph"][0];
   
       console.log($scope.data);
        
    });
    
    $scope.loadModel = function(id) {
       
        RestAPI.getModel(id).then(function(response){
 
                $scope.model = response;
                console.log($scope.model);
        });
        
    }

}]);