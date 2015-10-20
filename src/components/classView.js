const _ = require('lodash');
const jsonld = require('jsonld');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/classView.html'),
    link($scope, element) {
      // retrieves controller associated with the ngController directive
      $scope.modelController = element.controller();
    },
    controller($scope, classService) {
      'ngInject';

      let originalId;

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

      $scope.updateClass = () => {
        const classData = {
          '@graph': [$scope.class],
          '@context': $scope.context
        };

        return jsonld.promises.expand(classData).then(expanded => {
          const id = expanded[0]['@id'];
          return classService.updateClass(classData, id, originalId).then(() => {
            originalId = id;
            $scope.id = id;
            $scope.modelController.reload();
          });
        });
      };

      $scope.resetModel = () => {
        fetchClass(originalId);
      };
    }
  };
};
