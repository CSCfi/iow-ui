module.exports = /* @ngInject */ function modelController($scope, $routeParams, modelService) {
  modelService.getModelByUrn($routeParams.urn).then(response => {
    $scope.rawModel = response;
    $scope.model = response['@graph'][0];

    $scope.activate = klass => {
      $scope.class = klass;
    };
  });
};
