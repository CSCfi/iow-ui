module.exports = function /* @ngInject */ groupListDirective() {
  return {
    scope: {
      title: '@'
    },
    template: require('./templates/groupList.html'),
    controller($scope, groupService) {
      groupService.getGroups().then(response => {
        $scope.groups = response.data['@graph'];
      });
    }
  };
};
