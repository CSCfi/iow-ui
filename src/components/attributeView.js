const _ = require('lodash');

const constants = require('./constants');

module.exports = function classView($log) {
  'ngInject';

  let context;
  let originalId;

  return {
    scope: {
      attributeParam: '=attribute'
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    controller($scope, propertyService) {
      'ngInject';

      $scope.attributeValues = constants.attributeValues;

      $scope.$watch("attributeParam['@id']", id => {
        propertyService.getPropertyById(id).then(data => {
          $scope.attribute = data['@graph'][0];
          context = data['@context'];
          originalId = id;
        });
      });

      $scope.updateAttribute = () => {
        const ld = _.chain($scope.attribute)
          .clone()
          .assign({'@context': context})
          .value();
        const newId = $scope.attribute.id === originalId ? undefined : $scope.attribute.id;
        propertyService.updateProperty(ld, newId);
      };
    }
  };
};
