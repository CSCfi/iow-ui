module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      associationParam: '=association'
    },
    restrict: 'E',
    template: require('./templates/associationView.html'),
    controller($scope, propertyService, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;

      $scope.$watch("associationParam['@id']", id => {
        propertyService.getPropertyById(id, 'associationFrame').then(data => {
          $scope.association = data['@graph'][0];
        });
      });
    }
  };
};
