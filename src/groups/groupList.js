module.exports = function /* @ngInject */ groupListDirective() {
  return {
    template: require('./_groupList.html'),
    controller($scope, RestAPI) {
      $scope.groups = ['foo', 'bar'];
    }
  };
};
