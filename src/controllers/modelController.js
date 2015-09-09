module.exports = /* @ngInject */ function modelController($scope, $routeParams, modelService) {
  modelService.getModelByUrn($routeParams.urn).then(response => {
    $scope.rawModel = response;
    $scope.model = response['@graph'][0];

    $scope.activateClass = (klass, index) => {
      $scope.class = klass;
      $scope.activeClass = index;
      $scope.attribute = undefined;
      $scope.activeAttribute = undefined;
    };

    $scope.activateAttribute = (attribute, index) => {
      $scope.attribute = attribute;
      $scope.activeAttribute = index;
      $scope.class = undefined;
      $scope.activeClass = undefined;
    };
  });
};
