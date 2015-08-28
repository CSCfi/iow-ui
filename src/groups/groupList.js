module.exports = function /* @ngInject */ groupListDirective() {
  return {
    template: require('./_groupList.html'),
    controller($scope) {
      $scope.groups = ['foo', 'bar'];
    }
  };
};
