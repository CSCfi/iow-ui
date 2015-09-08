module.exports = /* @ngInject */ function modelController($scope, $routeParams, modelService) {
  $scope.model = modelService.getModelByUrn($routeParams.urn).then(response => {
    $scope.model = response.data;
  });
};
