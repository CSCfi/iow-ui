module.exports = /* @ngInject */ function modelController($scope, $routeParams, modelService) {
  modelService.getModelByUrn($routeParams.urn).then(response => {
    $scope.model = response;
  });
};
