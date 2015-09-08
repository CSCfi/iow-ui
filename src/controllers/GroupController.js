const _ = require('lodash');

module.exports = /* @ngInject */ function GroupController($scope, $routeParams, $log, groupService, modelService) {
  const urn = $routeParams.urn;

  groupService.getGroups().then(response => {
    $scope.group = _.findWhere(response['@graph'], {'@id': urn});
    $log.debug($scope.group);
  });

  modelService.getModelsByGroup(urn).then(response => {
    $scope.models = response['@graph'];
  });
};
