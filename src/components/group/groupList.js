module.exports = function groupListDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@'
    },
    restrict: 'E',
    template: require('./groupList.html'),
    controller($scope, groupService) {
      'ngInject';
      groupService.getGroups().then(groups => {
        $scope.groups = groups;
      }, error => $log.error(error));
    }
  };
};
