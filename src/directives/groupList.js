module.exports = function groupListDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@'
    },
    template: require('./templates/groupList.html'),
    controller($scope, groupService, modelLanguage) {
      'ngInject';
      $scope.getLanguage = modelLanguage.getLanguage;

      groupService.getGroups().then(framedResponse => {
        $scope.groups = framedResponse['@graph'];
      }, error => $log.error(error));
    }
  };
};
