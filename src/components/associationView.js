module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/associationView.html'),
    controller($scope, predicateService) {
      'ngInject';

      $scope.$watch('id', id => {
        predicateService.getPredicateById(id, 'associationFrame').then(data => {
          $scope.association = data['@graph'][0];
        });
      });
    }
  };
};
