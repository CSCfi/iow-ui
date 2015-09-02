module.exports = function /* @ngInject */ groupListDirective() {
  return {
    scope: {
      title: '@'
    },
    template: require('./templates/groupList.html'),
    controller($scope, GroupService) {
      GroupService.getGroups().then(response => {
        $scope.groups = response.data['@graph'];
      });
    }
  };
};
