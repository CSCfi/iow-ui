module.exports = function /* @ngInject */ groupListDirective() {
  return {
    scope: {
      title: '@'
    },
    template: require('./_groupList.html'),
    controller($scope, RestAPI) {
      $scope.groups = ['foo', 'bar'];
    }
  };
};
