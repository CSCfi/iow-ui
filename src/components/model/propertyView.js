const graphUtils = require('../../services/graphUtils');

module.exports = function propertyView() {
  'ngInject';
  return {
    scope: {
      property: '=',
      context: '='
    },
    restrict: 'E',
    template: require('./propertyView.html'),
    require: '^?editorView',
    link($scope, element, attributes, editorViewController) {
      $scope.editorViewController = editorViewController;
    },
    controller($scope, predicateService) {
      'ngInject';

      const predicateId = graphUtils.withFullIRI($scope.context, $scope.property.predicate);

      predicateService.getPredicateById(predicateId).then(predicate => {
        $scope.predicate = predicate['@graph'][0];
      });
    }
  };
};
