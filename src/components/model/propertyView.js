const graphUtils = require('../../services/entities');

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

      predicateService.getPredicate($scope.property.predicateId).then(predicate => {
        $scope.predicate = predicate;
      });
    }
  };
};
