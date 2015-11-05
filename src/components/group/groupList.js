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

      groupService.getGroups().then(framedResponse => {
        $scope.groups = framedResponse['@graph'];
      }, error => $log.error(error));
    }
  };
};
