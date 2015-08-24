angular.module('myApp.model', ['ngRoute'])

.config(function modelConfig($routeProvider) {
  $routeProvider.when('/model', {
    template: require('./model.html'),
    controller: 'ModelCtrl'
  });
})
.controller('ModelCtrl', function modelController($scope, $location, $log, RestAPI) {
  RestAPI.getAvailableModels().then(response => {
    $scope.data = response;
    $scope.graph = $scope.data['@graph'][0];
  });

  $scope.loadModel = id => {
    RestAPI.getModel(id).then(response => {
      $scope.model = response;
      $log.debug($scope.model);
    });
  };
});
