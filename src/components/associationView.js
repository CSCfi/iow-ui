module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      associationParam: '=association'
    },
    restrict: 'E',
    template: require('./templates/associationView.html'),
    controller($scope, propertyService) {
      'ngInject';

      $scope.$watch("associationParam['@id']", id => {
        propertyService.getPropertyById(id, 'associationFrame').then(data => {
          $scope.association = data['@graph'][0];
        });
      });
    }
  };
};
