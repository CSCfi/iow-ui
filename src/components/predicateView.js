module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '=predicate',
      context: '=context'
    },
    restrict: 'E',
    template: require('./templates/predicateView.html'),
    controller($scope, $http, propertyService) {
      'ngInject';

      propertyService.getProperty($scope.predicate, $scope.context).then(property => {
        $scope.$apply(() => {
          $scope.property = property['@graph'][0];
        });
      });
    }
  };
};
