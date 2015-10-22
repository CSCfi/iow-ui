const constants = require('./constants');
const contextUtils = require('../services/contextUtils');

module.exports = function propertyView($log) {
  'ngInject';
  return {
    scope: {
      property: '=',
      context: '='
    },
    restrict: 'E',
    template: require('./templates/propertyView.html'),
    controller($scope, predicateService) {
      'ngInject';

      $scope.attributeValues = constants.attributeValues;

      const predicateId = contextUtils.withFullIRI($scope.context, $scope.property.predicate);

      predicateService.getPredicateById(predicateId, 'predicateFrame').then(predicate => {
        $scope.predicate = predicate['@graph'][0];
      });
    }
  };
};
