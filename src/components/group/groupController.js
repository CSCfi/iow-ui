const _ = require('lodash');

module.exports = function GroupController($scope, $routeParams, $log, groupService, modelService, userService) {
  'ngInject';
  const urn = $routeParams.urn;

  groupService.getGroups().then(groups => {
    $scope.group = _.findWhere(groups, {id: urn});
  }, error => $log.error(error));

  modelService.getModelsByGroup(urn).then(models => {
    $scope.models = models;
  }, error => $log.error(error));

  $scope.notInGroup = () => !userService.isInGroup(urn);
  $scope.isLoggedIn = userService.isLoggedIn;
};
