module.exports = function /* @ngInject */ groupListDirective($log) {
  return {
    scope: {
      title: '@'
    },
    template: require('./templates/groupList.html'),
    controller($scope, groupService, modelLanguage) {
      $scope.getLanguage = modelLanguage.getLanguage;

      groupService.getGroups().then(framedResponse => {
        $scope.groups = framedResponse['@graph'];
      }, error => $log.error(error));
    }
  };
};
