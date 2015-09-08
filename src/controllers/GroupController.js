module.exports = /* @ngInject */ function GroupController($scope, $routeParams, modelService) {
  $scope.urn = $routeParams.urn;

  modelService.getModelsByGroup($routeParams.urn).then(response => {
    $scope.models = response['@graph'];
  });
};
