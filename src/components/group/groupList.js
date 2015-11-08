module.exports = function groupListDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@'
    },
    restrict: 'E',
    template: require('./groupList.html'),
    controller($scope, groupService, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;

      groupService.getGroups().then(groups => {
        $scope.groups = groups;
      }, error => $log.error(error));
    }
  };
};
