const _ = require('lodash');

module.exports = /* @ngInject */ function GroupController($scope, $routeParams, $log, groupService, modelService) {
  const urn = $routeParams.urn;

  groupService.getGroups().then(response => {
    $scope.group = _.findWhere(response['@graph'], {'@id': urn});
  }, error => $log.error(error));

  modelService.getModelsByGroup(urn).then(response => {
    $scope.models = response['@graph'];
  }, error => $log.error(error));
};
