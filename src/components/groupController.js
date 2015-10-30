const _ = require('lodash');

module.exports = function GroupController($scope, $routeParams, $log, groupService, modelService, userService) {
  'ngInject';
  const urn = $routeParams.urn;

 $scope.isPartOfGroup = false;

  groupService.getGroups().then(response => {
    $scope.group = _.findWhere(response['@graph'], {'@id': urn});
  }, error => $log.error(error));

  modelService.getModelsByGroup(urn).then(response => {
    $scope.models = response['@graph'];
  }, error => $log.error(error));

 $scope.notInGroup = !userService.isInGroup(urn);
 $scope.isLoggedIn = userService.isLoggedIn();

};
