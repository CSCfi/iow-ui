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
    require: '^?selectionView',
    link($scope, element, attributes, selectionViewController) {
      $scope.selectionViewController = selectionViewController;
    },
    controller($scope, predicateService) {
      'ngInject';

      const predicateId = graphUtils.withFullIRI($scope.context, $scope.property.predicate);

      predicateService.getPredicate(predicateId).then(predicate => {
        $scope.predicate = predicate['@graph'][0];
      });
    }
  };
};
