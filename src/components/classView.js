module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      id: '=classId'
    },
    restrict: 'E',
    template: require('./templates/classView.html'),
    controller($scope, $uibModal, classService) {
      'ngInject';
      $scope.$watch('id', id => {
        classService.getClass($scope.id).then(data => {
          $scope.class = data['@graph'][0];
          $scope.context = data['@context'];
        }, err => {
          $log.error(err);
        });
      });
      $scope.addProperty = () => {
        const modal = $uibModal.open({
          template: require('./templates/addProperty.html')
        });
      };
    }
  };
};
