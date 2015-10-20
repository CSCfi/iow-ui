module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/associationView.html'),
    controller($scope, propertyService) {
      'ngInject';

      $scope.$watch('id', id => {
        propertyService.getPropertyById(id, 'associationFrame').then(data => {
          $scope.association = data['@graph'][0];
        });
      });
    }
  };
};
