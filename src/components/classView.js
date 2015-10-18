const _ = require('lodash');

module.exports = function classView($log) {
  'ngInject';

  let originalId;

  return {
    scope: {
      id: '=classId'
    },
    restrict: 'E',
    template: require('./templates/classView.html'),
    controller($scope, $uibModal, $timeout, classService) {
      'ngInject';
      $scope.$watch('id', id => {
        classService.getClass($scope.id).then(data => {
          $scope.class = data['@graph'][0];
          $scope.context = data['@context'];
          originalId = id;
        }, err => {
          $log.error(err);
        });
      });
      $scope.addProperty = () => {
        const modal = $uibModal.open({
          template: require('./templates/addProperty.html')
        });
      };
      $scope.updateClass = () => {
        $timeout(() => {
          // FIXME: hack
          // wait for changes to settle in scope
          const ld = _.chain($scope.class)
            .clone()
            .assign({'@context': $scope.context})
            .value();

          classService.updateClass(ld, originalId);
        });
      };
    }
  };
};
