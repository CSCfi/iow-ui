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
    controller($scope, $uibModal, classService) {
      'ngInject';

      function fetchClass(id) {
        classService.getClass(id).then(data => {
          $scope.class = data['@graph'][0];
          $scope.context = data['@context'];
          originalId = id;
        }, err => {
          $log.error(err);
        });
      }

      $scope.$watch('id', id => {
        fetchClass(id);
      });
      $scope.addProperty = () => {
        $uibModal.open({
          template: require('./templates/addProperty.html')
        });
      };
      $scope.updateClass = () => {
        const classData = _.chain({})
          .assign({'@graph': [$scope.class]})
          .assign({'@context': $scope.context})
          .value();

        return jsonld.promises.expand(classData).then(expanded => {
          const id = expanded[0]['@id'];
          return classService.updateClass(classData, id, originalId).then(originalId = id);
        });
      };
      $scope.resetModel = () => {
        fetchClass(originalId);
      };
    }
  };
};
