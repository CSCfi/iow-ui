module.exports = function propertyView($log) {
  'ngInject';
  return {
    scope: {
      property: '=',
      context: '='
    },
    restrict: 'E',
    template: require('./templates/propertyView.html'),
    controller($scope, propertyService) {
      'ngInject';

      propertyService.getProperty($scope.property.predicate, $scope.context).then(predicate => {
        $scope.$apply(() => {
          $scope.predicate = predicate['@graph'][0];
        });
      });
    }
  };
};
