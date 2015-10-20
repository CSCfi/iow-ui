const _ = require('lodash');
const jsonld = require('jsonld');
const constants = require('./constants');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      attributeParam: '=attribute'
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    link($scope, element) {
      // retrieves controller associated with the ngController directive
      $scope.modelController = element.controller();
    },
    controller($scope, propertyService) {
      'ngInject';

      let context;
      let originalId;

      function fetchProperty(id) {
        propertyService.getPropertyById(id).then(data => {
          $scope.attribute = data['@graph'][0];
          context = data['@context'];
          originalId = id;
        });
      }

      $scope.attributeValues = constants.attributeValues;

      $scope.$watch("attributeParam['@id']", id => {
        fetchProperty(id);
      });

      $scope.updateAttribute = () => {
        const ld = _.chain($scope.attribute)
          .clone()
          .assign({'@context': context})
          .value();

        return jsonld.promises.expand(ld).then(expanded => {
          const id = expanded[0]['@id'];
          return propertyService.updateProperty(ld, id, originalId).then(() => {
            originalId = id;
            $scope.modelController.reload();
          });
        });
      };

      $scope.resetModel = () => {
        fetchProperty(originalId);
      };
    }
  };
};
